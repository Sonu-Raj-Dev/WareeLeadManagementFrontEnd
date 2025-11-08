from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import io
import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Lead Management System API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "sales"  # admin, manager, sales
    phone: Optional[str] = None
    district_id: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    district_id: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


# Lead Models
class LeadBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: str
    company: Optional[str] = None
    status: str = "new"  # new, contacted, qualified, proposal, negotiation, won, lost
    source: str = "manual"  # manual, website, referral, advertisement, upload
    district_id: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    budget: Optional[float] = None
    expected_close_date: Optional[datetime] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None
    district_id: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    budget: Optional[float] = None
    expected_close_date: Optional[datetime] = None

class Lead(LeadBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class LeadStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


# District Models
class DistrictBase(BaseModel):
    name: str
    code: str
    state: Optional[str] = None
    region: Optional[str] = None

class DistrictCreate(DistrictBase):
    pass

class District(DistrictBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Dashboard Models
class DashboardStats(BaseModel):
    total_leads: int
    new_leads: int
    contacted_leads: int
    qualified_leads: int
    won_leads: int
    lost_leads: int
    conversion_rate: float
    total_revenue: float
    leads_by_status: dict
    leads_by_district: dict
    leads_by_source: dict
    recent_activities: List[dict]


# ==================== AUTHENTICATION ====================

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise credentials_exception
    
    # Convert ISO string timestamps back to datetime objects
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    if isinstance(user.get('updated_at'), str):
        user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    
    return User(**user)

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user = await db.users.find_one({"email": user_login.email}, {"_id": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not verify_password(user_login.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Convert timestamps
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    if isinstance(user.get('updated_at'), str):
        user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    # Remove hashed_password before returning
    user.pop("hashed_password", None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": User(**user)
    }

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# ==================== USER ROUTES ====================

@api_router.post("/users", response_model=User)
async def create_user(user_create: UserCreate, current_user: User = Depends(get_current_active_user)):
    # Only admin can create users
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_create.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_create.model_dump()
    hashed_password = get_password_hash(user_dict.pop("password"))
    
    user_obj = User(**user_dict)
    doc = user_obj.model_dump()
    doc['hashed_password'] = hashed_password
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "hashed_password": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Convert timestamps
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        if isinstance(user.get('updated_at'), str):
            user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    
    return users

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: User = Depends(get_current_active_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Convert timestamps
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    if isinstance(user.get('updated_at'), str):
        user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    
    return User(**user)

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user)
):
    # Only admin or self can update
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if "password" in update_data:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    
    # Convert timestamps
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    if isinstance(user.get('updated_at'), str):
        user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    
    return User(**user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_active_user)):
    # Only admin can delete users
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}


# ==================== LEAD ROUTES ====================

@api_router.post("/leads", response_model=Lead)
async def create_lead(lead_create: LeadCreate, current_user: User = Depends(get_current_active_user)):
    lead_dict = lead_create.model_dump()
    lead_obj = Lead(**lead_dict, created_by=current_user.id)
    
    doc = lead_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    if doc.get('expected_close_date'):
        doc['expected_close_date'] = doc['expected_close_date'].isoformat()
    
    await db.leads.insert_one(doc)
    return lead_obj

@api_router.get("/leads", response_model=List[Lead])
async def get_leads(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    district_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    source: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    query = {}
    
    # Sales reps can only see their own leads
    if current_user.role == "sales":
        query["assigned_to"] = current_user.id
    
    if status:
        query["status"] = status
    if district_id:
        query["district_id"] = district_id
    if assigned_to and current_user.role in ["admin", "manager"]:
        query["assigned_to"] = assigned_to
    if source:
        query["source"] = source
    
    leads = await db.leads.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Convert timestamps
    for lead in leads:
        if isinstance(lead.get('created_at'), str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
        if isinstance(lead.get('updated_at'), str):
            lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
        if isinstance(lead.get('expected_close_date'), str):
            lead['expected_close_date'] = datetime.fromisoformat(lead['expected_close_date'])
    
    return leads

@api_router.get("/leads/{lead_id}", response_model=Lead)
async def get_lead(lead_id: str, current_user: User = Depends(get_current_active_user)):
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Sales reps can only see their own leads
    if current_user.role == "sales" and lead.get("assigned_to") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Convert timestamps
    if isinstance(lead.get('created_at'), str):
        lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    if isinstance(lead.get('updated_at'), str):
        lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
    if isinstance(lead.get('expected_close_date'), str):
        lead['expected_close_date'] = datetime.fromisoformat(lead['expected_close_date'])
    
    return Lead(**lead)

@api_router.put("/leads/{lead_id}", response_model=Lead)
async def update_lead(
    lead_id: str,
    lead_update: LeadUpdate,
    current_user: User = Depends(get_current_active_user)
):
    # Check if lead exists
    existing_lead = await db.leads.find_one({"id": lead_id})
    if not existing_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Sales reps can only update their own leads
    if current_user.role == "sales" and existing_lead.get("assigned_to") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in lead_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data.get('expected_close_date'):
        update_data['expected_close_date'] = update_data['expected_close_date'].isoformat()
    
    await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    
    # Convert timestamps
    if isinstance(lead.get('created_at'), str):
        lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    if isinstance(lead.get('updated_at'), str):
        lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
    if isinstance(lead.get('expected_close_date'), str):
        lead['expected_close_date'] = datetime.fromisoformat(lead['expected_close_date'])
    
    return Lead(**lead)

@api_router.patch("/leads/{lead_id}/status", response_model=Lead)
async def update_lead_status(
    lead_id: str,
    status_update: LeadStatusUpdate,
    current_user: User = Depends(get_current_active_user)
):
    # Check if lead exists
    existing_lead = await db.leads.find_one({"id": lead_id})
    if not existing_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Sales reps can only update their own leads
    if current_user.role == "sales" and existing_lead.get("assigned_to") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {
        "status": status_update.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if status_update.notes:
        update_data["notes"] = status_update.notes
    
    await db.leads.update_one({"id": lead_id}, {"$set": update_data})
    
    lead = await db.leads.find_one({"id": lead_id}, {"_id": 0})
    
    # Convert timestamps
    if isinstance(lead.get('created_at'), str):
        lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    if isinstance(lead.get('updated_at'), str):
        lead['updated_at'] = datetime.fromisoformat(lead['updated_at'])
    if isinstance(lead.get('expected_close_date'), str):
        lead['expected_close_date'] = datetime.fromisoformat(lead['expected_close_date'])
    
    return Lead(**lead)

@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, current_user: User = Depends(get_current_active_user)):
    # Only admin and manager can delete leads
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.leads.delete_one({"id": lead_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    return {"message": "Lead deleted successfully"}

@api_router.post("/leads/upload")
async def upload_leads(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="File must be CSV or Excel format")
    
    try:
        contents = await file.read()
        
        # Read file based on type
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = ['name', 'phone']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"File must contain columns: {', '.join(required_columns)}"
            )
        
        # Process and insert leads
        inserted_count = 0
        for _, row in df.iterrows():
            lead_data = {
                "name": str(row['name']),
                "phone": str(row['phone']),
                "email": str(row.get('email', '')) if pd.notna(row.get('email')) else None,
                "company": str(row.get('company', '')) if pd.notna(row.get('company')) else None,
                "status": str(row.get('status', 'new')),
                "source": "upload",
                "notes": str(row.get('notes', '')) if pd.notna(row.get('notes')) else None,
                "budget": float(row.get('budget', 0)) if pd.notna(row.get('budget')) else None,
                "created_by": current_user.id
            }
            
            lead_obj = Lead(**lead_data)
            doc = lead_obj.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            doc['updated_at'] = doc['updated_at'].isoformat()
            if doc.get('expected_close_date'):
                doc['expected_close_date'] = doc['expected_close_date'].isoformat()
            
            await db.leads.insert_one(doc)
            inserted_count += 1
        
        return {
            "message": f"Successfully uploaded {inserted_count} leads",
            "count": inserted_count
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.get("/leads/export/excel")
async def export_leads(
    status: Optional[str] = None,
    district_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    query = {}
    
    # Sales reps can only export their own leads
    if current_user.role == "sales":
        query["assigned_to"] = current_user.id
    
    if status:
        query["status"] = status
    if district_id:
        query["district_id"] = district_id
    
    leads = await db.leads.find(query, {"_id": 0}).to_list(1000)
    
    # Create Excel workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Leads"
    
    # Headers
    headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'District', 'Assigned To', 'Budget', 'Created At']
    ws.append(headers)
    
    # Style headers
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal='center')
    
    # Add data
    for lead in leads:
        ws.append([
            lead.get('name', ''),
            lead.get('email', ''),
            lead.get('phone', ''),
            lead.get('company', ''),
            lead.get('status', ''),
            lead.get('source', ''),
            lead.get('district_id', ''),
            lead.get('assigned_to', ''),
            lead.get('budget', ''),
            lead.get('created_at', '')
        ])
    
    # Save to bytes
    excel_file = io.BytesIO()
    wb.save(excel_file)
    excel_file.seek(0)
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=leads_export.xlsx"}
    )


# ==================== DISTRICT ROUTES ====================

@api_router.post("/districts", response_model=District)
async def create_district(district_create: DistrictCreate, current_user: User = Depends(get_current_active_user)):
    # Only admin can create districts
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    district_obj = District(**district_create.model_dump())
    doc = district_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.districts.insert_one(doc)
    return district_obj

@api_router.get("/districts", response_model=List[District])
async def get_districts(current_user: User = Depends(get_current_active_user)):
    districts = await db.districts.find({}, {"_id": 0}).to_list(1000)
    
    # Convert timestamps
    for district in districts:
        if isinstance(district.get('created_at'), str):
            district['created_at'] = datetime.fromisoformat(district['created_at'])
    
    return districts

@api_router.get("/districts/{district_id}", response_model=District)
async def get_district(district_id: str, current_user: User = Depends(get_current_active_user)):
    district = await db.districts.find_one({"id": district_id}, {"_id": 0})
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    # Convert timestamps
    if isinstance(district.get('created_at'), str):
        district['created_at'] = datetime.fromisoformat(district['created_at'])
    
    return District(**district)

@api_router.delete("/districts/{district_id}")
async def delete_district(district_id: str, current_user: User = Depends(get_current_active_user)):
    # Only admin can delete districts
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.districts.delete_one({"id": district_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="District not found")
    
    return {"message": "District deleted successfully"}


# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_active_user)):
    query = {}
    
    # Sales reps only see their own stats
    if current_user.role == "sales":
        query["assigned_to"] = current_user.id
    
    # Get all leads
    all_leads = await db.leads.find(query, {"_id": 0}).to_list(10000)
    
    # Calculate statistics
    total_leads = len(all_leads)
    
    # Count by status
    status_counts = {}
    for lead in all_leads:
        status = lead.get('status', 'new')
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Count by district
    district_counts = {}
    for lead in all_leads:
        district = lead.get('district_id', 'unassigned')
        district_counts[district] = district_counts.get(district, 0) + 1
    
    # Count by source
    source_counts = {}
    for lead in all_leads:
        source = lead.get('source', 'manual')
        source_counts[source] = source_counts.get(source, 0) + 1
    
    # Calculate revenue
    total_revenue = sum(lead.get('budget', 0) or 0 for lead in all_leads if lead.get('status') == 'won')
    
    # Calculate conversion rate
    won_leads = status_counts.get('won', 0)
    conversion_rate = (won_leads / total_leads * 100) if total_leads > 0 else 0
    
    # Get recent activities (last 10 updated leads)
    recent_leads = sorted(all_leads, key=lambda x: x.get('updated_at', ''), reverse=True)[:10]
    recent_activities = [
        {
            "lead_id": lead.get('id'),
            "lead_name": lead.get('name'),
            "status": lead.get('status'),
            "updated_at": lead.get('updated_at')
        }
        for lead in recent_leads
    ]
    
    return DashboardStats(
        total_leads=total_leads,
        new_leads=status_counts.get('new', 0),
        contacted_leads=status_counts.get('contacted', 0),
        qualified_leads=status_counts.get('qualified', 0),
        won_leads=status_counts.get('won', 0),
        lost_leads=status_counts.get('lost', 0),
        conversion_rate=round(conversion_rate, 2),
        total_revenue=total_revenue,
        leads_by_status=status_counts,
        leads_by_district=district_counts,
        leads_by_source=source_counts,
        recent_activities=recent_activities
    )


# ==================== SEED DATA ROUTE ====================

@api_router.post("/seed-data")
async def seed_data():
    """Initialize database with sample data"""
    
    # Check if data already exists
    user_count = await db.users.count_documents({})
    if user_count > 0:
        return {"message": "Database already seeded"}
    
    # Create admin user
    admin_user = User(
        email="admin@leadmanagement.com",
        full_name="Admin User",
        role="admin",
        phone="+1234567890",
        is_active=True
    )
    admin_doc = admin_user.model_dump()
    admin_doc['hashed_password'] = get_password_hash("admin123")
    admin_doc['created_at'] = admin_doc['created_at'].isoformat()
    admin_doc['updated_at'] = admin_doc['updated_at'].isoformat()
    await db.users.insert_one(admin_doc)
    
    # Create manager user
    manager_user = User(
        email="manager@leadmanagement.com",
        full_name="Manager User",
        role="manager",
        phone="+1234567891",
        is_active=True
    )
    manager_doc = manager_user.model_dump()
    manager_doc['hashed_password'] = get_password_hash("manager123")
    manager_doc['created_at'] = manager_doc['created_at'].isoformat()
    manager_doc['updated_at'] = manager_doc['updated_at'].isoformat()
    await db.users.insert_one(manager_doc)
    
    # Create sales user
    sales_user = User(
        email="sales@leadmanagement.com",
        full_name="Sales Rep",
        role="sales",
        phone="+1234567892",
        is_active=True
    )
    sales_doc = sales_user.model_dump()
    sales_doc['hashed_password'] = get_password_hash("sales123")
    sales_doc['created_at'] = sales_doc['created_at'].isoformat()
    sales_doc['updated_at'] = sales_doc['updated_at'].isoformat()
    await db.users.insert_one(sales_doc)
    
    # Create districts
    districts_data = [
        {"name": "North District", "code": "ND", "state": "California", "region": "West"},
        {"name": "South District", "code": "SD", "state": "Texas", "region": "South"},
        {"name": "East District", "code": "ED", "state": "New York", "region": "East"},
        {"name": "West District", "code": "WD", "state": "Washington", "region": "West"},
    ]
    
    district_ids = []
    for district_data in districts_data:
        district = District(**district_data)
        doc = district.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.districts.insert_one(doc)
        district_ids.append(district.id)
    
    # Create sample leads
    leads_data = [
        {"name": "John Doe", "email": "john@example.com", "phone": "+1234567893", "company": "Tech Corp", "status": "new", "source": "website", "budget": 50000},
        {"name": "Jane Smith", "email": "jane@example.com", "phone": "+1234567894", "company": "Business Inc", "status": "contacted", "source": "referral", "budget": 75000},
        {"name": "Bob Johnson", "email": "bob@example.com", "phone": "+1234567895", "company": "Startup LLC", "status": "qualified", "source": "advertisement", "budget": 100000},
        {"name": "Alice Brown", "email": "alice@example.com", "phone": "+1234567896", "company": "Enterprise Co", "status": "proposal", "source": "manual", "budget": 150000},
        {"name": "Charlie Wilson", "email": "charlie@example.com", "phone": "+1234567897", "company": "Solutions Ltd", "status": "won", "source": "website", "budget": 200000},
        {"name": "Diana Davis", "email": "diana@example.com", "phone": "+1234567898", "company": "Digital Agency", "status": "lost", "source": "referral", "budget": 60000},
        {"name": "Eve Martinez", "email": "eve@example.com", "phone": "+1234567899", "company": "Creative Studio", "status": "new", "source": "advertisement", "budget": 45000},
        {"name": "Frank Garcia", "email": "frank@example.com", "phone": "+1234567800", "company": "Consulting Group", "status": "contacted", "source": "manual", "budget": 80000},
    ]
    
    for i, lead_data in enumerate(leads_data):
        lead_data['district_id'] = district_ids[i % len(district_ids)]
        lead_data['assigned_to'] = sales_user.id
        lead_data['created_by'] = admin_user.id
        
        lead = Lead(**lead_data)
        doc = lead.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['updated_at'] = doc['updated_at'].isoformat()
        if doc.get('expected_close_date'):
            doc['expected_close_date'] = doc['expected_close_date'].isoformat()
        await db.leads.insert_one(doc)
    
    return {
        "message": "Database seeded successfully",
        "users": {
            "admin": {"email": "admin@leadmanagement.com", "password": "admin123"},
            "manager": {"email": "manager@leadmanagement.com", "password": "manager123"},
            "sales": {"email": "sales@leadmanagement.com", "password": "sales123"}
        }
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
