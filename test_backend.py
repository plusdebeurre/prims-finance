
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
    
    # Test suppliers endpoint
    try:
        response = requests.get(f"{backend_url}/api/suppliers/")
        if response.status_code == 200:
            suppliers = response.json()
            print(f"✅ Found {len(suppliers)} suppliers")
        else:
            print(f"❌ Suppliers endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Suppliers endpoint error: {str(e)}")
    
    # Test templates endpoint
    try:
        response = requests.get(f"{backend_url}/api/templates/")
        if response.status_code == 200:
            templates = response.json()
            print(f"✅ Found {len(templates)} templates")
        else:
            print(f"❌ Templates endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Templates endpoint error: {str(e)}")
    
    # Test contracts endpoint
    try:
        response = requests.get(f"{backend_url}/api/contracts/")
        if response.status_code == 200:
            contracts = response.json()
            print(f"✅ Found {len(contracts)} contracts")
        else:
            print(f"❌ Contracts endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Contracts endpoint error: {str(e)}")

def main():
    # Test backend API
    test_backend_api()
    return 0

if __name__ == "__main__":
    sys.exit(main())
