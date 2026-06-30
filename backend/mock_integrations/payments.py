from datetime import datetime, timedelta

def get_mock_payments():
    now = datetime.now()
    return [
        {
            "merchant": "Spotify",
            "amount": 10.99,
            "due_date": now + timedelta(days=1),
            "status": "pending"
        },
        {
            "merchant": "Electric Utility",
            "amount": 85.50,
            "due_date": now + timedelta(days=5),
            "status": "pending"
        }
    ]
