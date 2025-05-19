
import requests
import sys

def test_backend_api():
    """Test the backend API endpoints"""
    print("\n🔍 Testing Backend API...")
    backend_url = "http://localhost:8001"
    
    # Test health endpoint
    try:
        response = requests.get(f"{backend_url}/api/health")
        if response.status_code == 200:
            print(f"✅ Health endpoint: {response.json()}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health endpoint error: {str(e)}")
    
    # Login to get token
    try:
        login_data = {
            "username": "admin@prismfinance.com",
            "password": "admin123"
        }
        response = requests.post(f"{backend_url}/api/auth/token", data=login_data)
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"✅ Login successful, got token")
            
            # Set headers with token
            headers = {"Authorization": f"Bearer {token}"}
            
            # Get user info to get company_id
            try:
                response = requests.get(f"{backend_url}/api/users/me", headers=headers)
                if response.status_code == 200:
                    user_info = response.json()
                    company_id = user_info.get("company_id")
                    print(f"✅ Got user info, company_id: {company_id}")
                else:
                    print(f"❌ User info endpoint failed: {response.status_code}")
                    company_id = "default_company_id"  # Fallback
            except Exception as e:
                print(f"❌ User info endpoint error: {str(e)}")
                company_id = "default_company_id"  # Fallback
            
            # Test suppliers endpoint
            try:
                response = requests.get(f"{backend_url}/api/suppliers/", headers=headers)
                if response.status_code == 200:
                    suppliers = response.json()
                    print(f"✅ Found {len(suppliers)} suppliers")
                else:
                    print(f"❌ Suppliers endpoint failed: {response.status_code}")
            except Exception as e:
                print(f"❌ Suppliers endpoint error: {str(e)}")
            
            # Test templates endpoint
            try:
                response = requests.get(f"{backend_url}/api/templates/", headers=headers)
                if response.status_code == 200:
                    templates = response.json()
                    print(f"✅ Found {len(templates)} templates")
                else:
                    print(f"❌ Templates endpoint failed: {response.status_code}")
            except Exception as e:
                print(f"❌ Templates endpoint error: {str(e)}")
            
            # Test contracts endpoint
            try:
                response = requests.get(f"{backend_url}/api/contracts/", headers=headers)
                if response.status_code == 200:
                    contracts = response.json()
                    print(f"✅ Found {len(contracts)} contracts")
                else:
                    print(f"❌ Contracts endpoint failed: {response.status_code}")
            except Exception as e:
                print(f"❌ Contracts endpoint error: {str(e)}")
            
            # Try to create a supplier
            try:
                supplier_data = {
                    "company_name": "ABC Corp",
                    "email": "supplier@example.com",
                    "siret": "12345678901234",
                    "company_id": company_id
                }
                response = requests.post(f"{backend_url}/api/suppliers/", json=supplier_data, headers=headers)
                if response.status_code == 200 or response.status_code == 201:
                    print(f"✅ Created supplier: {response.json()}")
                else:
                    print(f"❌ Supplier creation failed: {response.status_code}, {response.text}")
            except Exception as e:
                print(f"❌ Supplier creation error: {str(e)}")
            
        else:
            print(f"❌ Login failed: {response.status_code}, {response.text}")
    except Exception as e:
        print(f"❌ Login error: {str(e)}")

def main():
    # Test backend API
    test_backend_api()
    return 0

if __name__ == "__main__":
    sys.exit(main())
