import requests

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Login
login_data = {
    "email": "khalida@clinic.com",
    "password": "password123"
}
res = requests.post(f"{BASE_URL}/auth/login", json=login_data)
print("Login status:", res.status_code)
if res.status_code != 200:
    print(res.json())
    exit(1)

token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Test /me
res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
print("/auth/me status:", res.status_code)
if res.status_code != 200:
    print(res.json())

# Test /analytics/summary
res = requests.get(f"{BASE_URL}/analytics/summary", headers=headers)
print("/analytics/summary status:", res.status_code)
if res.status_code != 200:
    print(res.json())

# Test /consultations
res = requests.get(f"{BASE_URL}/consultations", headers=headers)
print("/consultations status:", res.status_code)
if res.status_code != 200:
    print(res.json())
