
import requests
import sys
import time
import uuid
from datetime import datetime

class PrismFinanceAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.company_id = None
        self.supplier_id = None
        self.supplier_email = None
        self.supplier_password = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No detail provided')
                    print(f"Error detail: {error_detail}")
                except:
                    print(f"Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self, username, password):
        """Test login and get token"""
        print(f"\n🔑 Attempting login with {username}...")
        
        try:
            # For token endpoint, we need to use form data
            formData = {
                'username': username,
                'password': password
            }
            
            url = f"{self.base_url}/api/auth/token"
            response = requests.post(
                url, 
                data=formData,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                self.user_id = data.get('user_id')
                self.company_id = data.get('company_id')
                self.supplier_id = data.get('supplier_id')
                print(f"✅ Login successful - User ID: {self.user_id}, Role: {data.get('role')}")
                return True
            else:
                print(f"❌ Login failed - Status: {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No detail provided')
                    print(f"Error detail: {error_detail}")
                except:
                    print(f"Response text: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login failed - Error: {str(e)}")
            return False
            
    def test_register_supplier(self, email=None, password="Password123!"):
        """Test supplier registration"""
        if not email:
            # Generate a unique email for testing
            timestamp = int(time.time())
            email = f"test_supplier_{timestamp}@example.com"
        
        self.supplier_email = email
        self.supplier_password = password
        
        # Create registration data
        registration_data = {
            "email": email,
            "password": password,
            "name": "Test Supplier",
            "role": "supplier",
            "company_data": {
                "name": "Test Company",
                "company_type": "SAS",
                "address": "123 Test Street",
                "postal_code": "75001",
                "city": "Paris",
                "country": "France",
                "registration_number": "123 456 789 00012",
                "registration_city": "Paris",
                "representative_name": "John Doe",
                "representative_role": "CEO",
                "phone": "+33 1 23 45 67 89"
            }
        }
        
        # Try to get active general conditions first
        try:
            response = requests.get(f"{self.base_url}/api/general-conditions/active")
            if response.status_code == 200:
                gc_data = response.json()
                if gc_data and 'id' in gc_data:
                    registration_data["accepted_conditions_id"] = gc_data["id"]
        except Exception as e:
            print(f"Warning: Could not fetch general conditions: {str(e)}")
        
        # Register the supplier
        return self.run_test(
            "Register Supplier",
            "POST",
            "auth/register",
            200,
            data=registration_data
        )

    def test_auth_endpoints(self):
        """Test authentication-related endpoints"""
        tests = [
            # Get current user profile
            lambda: self.run_test("Get User Profile", "GET", "auth/me", 200)
        ]
        
        results = []
        for test in tests:
            results.append(test())
        
        return all(result[0] for result in results)

    def test_suppliers_endpoints(self):
        """Test supplier-related endpoints"""
        tests = [
            # Get suppliers list
            lambda: self.run_test("Get Suppliers List", "GET", "suppliers", 200)
        ]
        
        results = []
        for test in tests:
            results.append(test())
        
        return all(result[0] for result in results)

    def test_contracts_endpoints(self):
        """Test contract-related endpoints"""
        tests = [
            # Get contracts list
            lambda: self.run_test("Get Contracts List", "GET", "contracts", 200)
        ]
        
        results = []
        for test in tests:
            results.append(test())
        
        return all(result[0] for result in results)

    def test_templates_endpoints(self):
        """Test template-related endpoints"""
        tests = [
            # Get templates list
            lambda: self.run_test("Get Templates List", "GET", "templates", 200)
        ]
        
        results = []
        for test in tests:
            results.append(test())
        
        return all(result[0] for result in results)

def run_tests():
    # Get the backend URL from environment variable
    backend_url = "https://cbdb9793-9ca3-49a0-b2b7-4fedf07917dd.preview.emergentagent.com"
    
    print(f"🚀 Starting API tests against {backend_url}")
    
    tester = PrismFinanceAPITester(backend_url)
    
    # Test login with admin credentials
    if not tester.test_login("admin@prismfinance.com", "admin123"):
        print("❌ Login failed, stopping tests")
        return 1
    
    # Run all endpoint tests
    print("\n📋 Testing API endpoints...")
    
    tests = [
        ("Authentication", tester.test_auth_endpoints),
        ("Suppliers", tester.test_suppliers_endpoints),
        ("Contracts", tester.test_contracts_endpoints),
        ("Templates", tester.test_templates_endpoints)
    ]
    
    for name, test_func in tests:
        print(f"\n🔍 Testing {name} endpoints...")
        if test_func():
            print(f"✅ All {name} tests passed")
        else:
            print(f"❌ Some {name} tests failed")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(run_tests())
