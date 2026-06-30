import logging
from fastapi import APIRouter
from mock_integrations.payments import get_mock_payments

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/")
def get_payments():
    logger.info("Request received: GET /payments/")
    payments = get_mock_payments()
    logger.info(f"Success: Returned {len(payments)} payments")
    return [{**p, "due_date": p["due_date"].isoformat()} for p in payments]

@router.post("/approve")
def approve_payment(merchant: str = "Spotify"):
    logger.info(f"Request received: POST /payments/approve - Merchant: {merchant}")
    logger.info("Success: Payment approved")
    return {"status": "approved", "message": f"Payment for {merchant} was approved successfully."}

