import requests
import unittest
import os
import json
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://cbdb9793-9ca3-49a0-b2b7-4fedf07917dd.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

class PrismFinanceAPITest:
    def __init__(self):
        # Generate unique test data
        self.timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        self.test_supplier = {
            "name": f"Test Supplier {self.timestamp}",
            "siret": f"SIRET{self.timestamp}",
            "vat_number": f"VAT{self.timestamp}",
            "profession": "Test Profession",
            "address": "123 Test Street",
            "postal_code": "75001",
            "city": "Paris",
            "country": "France",
            "iban": f"FR7630001007941234567890185",
            "bic": "BNPAFRPP",
            "vat_rates": [20.0],
            "emails": [f"test{self.timestamp}@example.com"]
        }
        self.created_supplier_id = None
        self.created_template_id = None
        self.token = None
        self.headers = {'Content-Type': 'application/json'}
        
    def test_00_login(self):
        """Test login with admin credentials"""
        login_data = {
            'username': 'admin@prismfinance.com',
            'password': 'admin123'
        }
        
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        
        response = requests.post(
            f"{API_URL}/auth/token", 
            data=login_data,
            headers=headers
        )
        print(f"POST /auth/token status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access_token')
            if self.token:
                self.headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.token}'
                }
                print("✅ Login successful, token obtained")
                return True
            else:
                print("❌ Login response did not contain a token")
                return False
        else:
            print(f"❌ Login failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

    def test_01_api_health(self):
        """Test if the API is accessible"""
        try:
            response = requests.get(f"{BACKEND_URL}/api/suppliers", headers=self.headers)
            print(f"✅ API is accessible at {BACKEND_URL}")
            return True
        except Exception as e:
            print(f"❌ API is not accessible: {str(e)}")
            return False

    def test_02_get_suppliers(self):
        """Test getting suppliers list"""
        response = requests.get(f"{API_URL}/suppliers", headers=self.headers)
        print(f"GET /suppliers status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ GET /suppliers successful")
            suppliers = response.json()
            print(f"✅ Found {len(suppliers)} suppliers")
            return True
        else:
            print(f"❌ GET /suppliers failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

    def test_03_create_supplier(self):
        """Test creating a new supplier"""
        response = requests.post(f"{API_URL}/suppliers", json=self.test_supplier, headers=self.headers)
        print(f"POST /suppliers status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ POST /suppliers successful")
            supplier = response.json()
            self.created_supplier_id = supplier["id"]
            print(f"✅ Created supplier with ID: {self.created_supplier_id}")
            return True
        else:
            print(f"❌ POST /suppliers failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

    def test_04_get_supplier_by_id(self):
        """Test getting a supplier by ID"""
        if not self.created_supplier_id:
            if not self.test_03_create_supplier():
                return False
            
        response = requests.get(f"{API_URL}/suppliers/{self.created_supplier_id}", headers=self.headers)
        print(f"GET /suppliers/{self.created_supplier_id} status code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ GET /suppliers/{self.created_supplier_id} successful")
            supplier = response.json()
            print(f"✅ Retrieved supplier: {supplier['name']}")
            return True
        else:
            print(f"❌ GET /suppliers/{self.created_supplier_id} failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

    def test_05_update_supplier(self):
        """Test updating a supplier"""
        if not self.created_supplier_id:
            if not self.test_03_create_supplier():
                return False
            
        updated_data = self.test_supplier.copy()
        updated_data["name"] = f"Updated Supplier {self.timestamp}"
        
        response = requests.put(f"{API_URL}/suppliers/{self.created_supplier_id}", json=updated_data, headers=self.headers)
        print(f"PUT /suppliers/{self.created_supplier_id} status code: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ PUT /suppliers/{self.created_supplier_id} successful")
            supplier = response.json()
            print(f"✅ Updated supplier name to: {supplier['name']}")
            return True
        else:
            print(f"❌ PUT /suppliers/{self.created_supplier_id} failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

    def test_06_upload_contract_template(self):
        """Test uploading a contract template"""
        # Create a simple test template file
        template_path = "/tmp/test_template.docx"
        with open(template_path, "w") as f:
            f.write("This is a test template with {{variable1}} and {{variable2}}")
        
        # Prepare multipart form data
        files = {
            'file': ('test_template.docx', open(template_path, 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        }
        data = {
            'name': f'Test Template {self.timestamp}'
        }
        
        # For multipart/form-data, we need to remove Content-Type from headers
        headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
        
        response = requests.post(f"{API_URL}/contract-templates", files=files, data=data, headers=headers)
        print(f"POST /contract-templates status code: {response.status_code}")
        
        # Clean up the test file
        os.remove(template_path)
        
        if response.status_code == 200:
            print("✅ POST /contract-templates successful")
            template = response.json()
            self.created_template_id = template["id"]
            print(f"✅ Created template with ID: {self.created_template_id}")
            return True
        else:
            print(f"❌ POST /contract-templates failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

    def test_07_get_contract_templates(self):
        """Test getting contract templates"""
        response = requests.get(f"{API_URL}/contract-templates", headers=self.headers)
        print(f"GET /contract-templates status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ GET /contract-templates successful")
            templates = response.json()
            print(f"✅ Found {len(templates)} templates")
            return True
        else:
            print(f"❌ GET /contract-templates failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

    def test_08_generate_contract(self):
        """Test generating a contract"""
        if not self.created_supplier_id:
            if not self.test_03_create_supplier():
                return False
                
        if not self.created_template_id:
            if not self.test_06_upload_contract_template():
                return False
            
        # Prepare form data
        data = {
            'supplier_id': self.created_supplier_id,
            'template_id': self.created_template_id,
            'variables': json.dumps({
                "variable1": "Test Value 1",
                "variable2": "Test Value 2"
            })
        }
        
        # For multipart/form-data, we need to remove Content-Type from headers
        headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
        
        response = requests.post(f"{API_URL}/contracts/generate", data=data, headers=headers)
        print(f"POST /contracts/generate status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ POST /contracts/generate successful")
            contract = response.json()
            print(f"✅ Generated contract with ID: {contract['id']}")
            return True
        else:
            print(f"❌ POST /contracts/generate failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

    def test_09_get_contracts(self):
        """Test getting contracts"""
        response = requests.get(f"{API_URL}/contracts", headers=self.headers)
        print(f"GET /contracts status code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ GET /contracts successful")
            contracts = response.json()
            print(f"✅ Found {len(contracts)} contracts")
            return True
        else:
            print(f"❌ GET /contracts failed with status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

def run_tests():
    """Run all tests in sequence and report results"""
    test = PrismFinanceAPITest()
    
    print("\n🔍 PRISM'FINANCE API TEST RESULTS 🔍\n")
    
    # Run tests in sequence
    tests = [
        test.test_00_login,
        test.test_01_api_health,
        test.test_02_get_suppliers,
        test.test_03_create_supplier,
        test.test_04_get_supplier_by_id,
        test.test_05_update_supplier,
        test.test_06_upload_contract_template,
        test.test_07_get_contract_templates,
        test.test_08_generate_contract,
        test.test_09_get_contracts
    ]
    
    results = []
    for test_func in tests:
        print(f"\n📋 Running test: {test_func.__doc__}")
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            results.append(False)
    
    # Print summary
    print("\n📊 TEST SUMMARY 📊")
    passed = results.count(True)
    failed = results.count(False)
    print(f"✅ Passed: {passed}/{len(tests)}")
    print(f"❌ Failed: {failed}/{len(tests)}")
    
    return passed == len(tests)

if __name__ == "__main__":
    run_tests()