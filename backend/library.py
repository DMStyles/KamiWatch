from fastapi import APIRouter
from database import get_library

router = APIRouter()

@router.get("")
def library():
    return get_library()
