import requests
import unittest
import os
import json
from datetime import datetime

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://6889fd20-755d-4ec7-b787-a13d7a3c9ecc.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

class PrismFinanceAPITest(unittest.TestCase):
    def setUp(self):
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

    def test_01_get_suppliers_empty(self):
        """Test getting suppliers list"""
        response = requests.get(f"{API_URL}/suppliers")
        self.assertEqual(response.status_code, 200)
        print(f"✅ GET /suppliers returned status code {response.status_code}")
        
        # Check if response is a list
        suppliers = response.json()
        self.assertIsInstance(suppliers, list)
        print(f"✅ Suppliers list contains {len(suppliers)} suppliers")

    def test_02_create_supplier(self):
        """Test creating a new supplier"""
        response = requests.post(f"{API_URL}/suppliers", json=self.test_supplier)
        self.assertEqual(response.status_code, 200)
        print(f"✅ POST /suppliers returned status code {response.status_code}")
        
        # Check response data
        supplier = response.json()
        self.assertEqual(supplier["name"], self.test_supplier["name"])
        self.assertEqual(supplier["siret"], self.test_supplier["siret"])
        self.assertEqual(supplier["vat_number"], self.test_supplier["vat_number"])
        self.assertEqual(supplier["emails"], self.test_supplier["emails"])
        
        # Save the created supplier ID for later tests
        self.created_supplier_id = supplier["id"]
        print(f"✅ Created supplier with ID: {self.created_supplier_id}")

    def test_03_get_supplier_by_id(self):
        """Test getting a supplier by ID"""
        # First create a supplier if we don't have one
        if not self.created_supplier_id:
            self.test_02_create_supplier()
            
        response = requests.get(f"{API_URL}/suppliers/{self.created_supplier_id}")
        self.assertEqual(response.status_code, 200)
        print(f"✅ GET /suppliers/{self.created_supplier_id} returned status code {response.status_code}")
        
        # Check response data
        supplier = response.json()
        self.assertEqual(supplier["id"], self.created_supplier_id)
        self.assertEqual(supplier["name"], self.test_supplier["name"])
        print(f"✅ Retrieved supplier: {supplier['name']}")

    def test_04_update_supplier(self):
        """Test updating a supplier"""
        # First create a supplier if we don't have one
        if not self.created_supplier_id:
            self.test_02_create_supplier()
            
        # Update the supplier
        updated_data = self.test_supplier.copy()
        updated_data["name"] = f"Updated Supplier {self.timestamp}"
        
        response = requests.put(f"{API_URL}/suppliers/{self.created_supplier_id}", json=updated_data)
        self.assertEqual(response.status_code, 200)
        print(f"✅ PUT /suppliers/{self.created_supplier_id} returned status code {response.status_code}")
        
        # Check response data
        supplier = response.json()
        self.assertEqual(supplier["name"], updated_data["name"])
        print(f"✅ Updated supplier name to: {supplier['name']}")

    def test_05_upload_contract_template(self):
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
        
        response = requests.post(f"{API_URL}/contract-templates", files=files, data=data)
        
        # Clean up the test file
        os.remove(template_path)
        
        self.assertEqual(response.status_code, 200)
        print(f"✅ POST /contract-templates returned status code {response.status_code}")
        
        # Check response data
        template = response.json()
        self.assertEqual(template["name"], data["name"])
        self.assertIn("variable1", template["variables"])
        self.assertIn("variable2", template["variables"])
        
        # Save the created template ID for later tests
        self.created_template_id = template["id"]
        print(f"✅ Created template with ID: {self.created_template_id}")

    def test_06_get_contract_templates(self):
        """Test getting contract templates"""
        response = requests.get(f"{API_URL}/contract-templates")
        self.assertEqual(response.status_code, 200)
        print(f"✅ GET /contract-templates returned status code {response.status_code}")
        
        # Check if response is a list
        templates = response.json()
        self.assertIsInstance(templates, list)
        print(f"✅ Templates list contains {len(templates)} templates")

    def test_07_generate_contract(self):
        """Test generating a contract"""
        # First create a supplier and template if we don't have them
        if not self.created_supplier_id:
            self.test_02_create_supplier()
        if not self.created_template_id:
            self.test_05_upload_contract_template()
            
        # Prepare form data
        data = {
            'supplier_id': self.created_supplier_id,
            'template_id': self.created_template_id,
            'variables': json.dumps({
                "variable1": "Test Value 1",
                "variable2": "Test Value 2"
            })
        }
        
        response = requests.post(f"{API_URL}/contracts/generate", data=data)
        self.assertEqual(response.status_code, 200)
        print(f"✅ POST /contracts/generate returned status code {response.status_code}")
        
        # Check response data
        contract = response.json()
        self.assertEqual(contract["supplier_id"], self.created_supplier_id)
        self.assertEqual(contract["template_id"], self.created_template_id)
        print(f"✅ Generated contract with ID: {contract['id']}")

    def test_08_get_contracts(self):
        """Test getting contracts"""
        response = requests.get(f"{API_URL}/contracts")
        self.assertEqual(response.status_code, 200)
        print(f"✅ GET /contracts returned status code {response.status_code}")
        
        # Check if response is a list
        contracts = response.json()
        self.assertIsInstance(contracts, list)
        print(f"✅ Contracts list contains {len(contracts)} contracts")

if __name__ == "__main__":
    # Run the tests in order
    test_suite = unittest.TestSuite()
    test_suite.addTest(PrismFinanceAPITest('test_01_get_suppliers_empty'))
    test_suite.addTest(PrismFinanceAPITest('test_02_create_supplier'))
    test_suite.addTest(PrismFinanceAPITest('test_03_get_supplier_by_id'))
    test_suite.addTest(PrismFinanceAPITest('test_04_update_supplier'))
    test_suite.addTest(PrismFinanceAPITest('test_05_upload_contract_template'))
    test_suite.addTest(PrismFinanceAPITest('test_06_get_contract_templates'))
    test_suite.addTest(PrismFinanceAPITest('test_07_generate_contract'))
    test_suite.addTest(PrismFinanceAPITest('test_08_get_contracts'))
    
    runner = unittest.TextTestRunner()
    runner.run(test_suite)