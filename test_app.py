
import requests
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException

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

def test_frontend():
    """Test the frontend using Selenium"""
    print("\n🔍 Testing Frontend...")
    frontend_url = "http://localhost:3000"
    
    # Configure Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    try:
        # Initialize the driver
        driver = webdriver.Chrome(options=chrome_options)
        driver.get(f"{frontend_url}/login")
        
        # Wait for the page to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Check if we're on the login page
        try:
            login_title = driver.find_element(By.XPATH, "//h1[contains(text(), 'Sign in')]")
            print("✅ Login page loaded successfully")
            
            # Find login form elements
            email_field = driver.find_element(By.ID, "email-address")
            password_field = driver.find_element(By.ID, "password")
            login_button = driver.find_element(By.XPATH, "//button[@type='submit']")
            
            # Fill in login credentials
            email_field.send_keys("admin@prismfinance.com")
            password_field.send_keys("admin123")
            login_button.click()
            
            # Wait for dashboard to load
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Dashboard')]"))
                )
                print("✅ Login successful, dashboard loaded")
                
                # Check language toggle
                try:
                    language_button = driver.find_element(By.XPATH, "//button[contains(text(), 'FR')]")
                    language_button.click()
                    time.sleep(1)
                    print("✅ Language toggle clicked")
                except NoSuchElementException:
                    print("❌ Language toggle not found")
                
                # Check navigation menu
                try:
                    nav_items = driver.find_elements(By.CLASS_NAME, "nav-link")
                    print(f"✅ Found {len(nav_items)} navigation menu items")
                except NoSuchElementException:
                    print("❌ Navigation menu not found")
                
                # Navigate to Suppliers page
                try:
                    suppliers_link = driver.find_element(By.XPATH, "//a[contains(text(), 'Suppliers')]")
                    suppliers_link.click()
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Add Supplier')]"))
                    )
                    print("✅ Navigated to Suppliers page")
                    
                    # Try to add a supplier
                    add_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Add Supplier')]")
                    add_button.click()
                    
                    # Wait for form to load
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.XPATH, "//input[@name='company_name']"))
                    )
                    
                    # Fill in supplier form
                    driver.find_element(By.XPATH, "//input[@name='company_name']").send_keys("ABC Corp")
                    driver.find_element(By.XPATH, "//input[@name='email']").send_keys("supplier@example.com")
                    driver.find_element(By.XPATH, "//input[@name='siret']").send_keys("12345678901234")
                    
                    # Submit form
                    save_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Save')]")
                    save_button.click()
                    
                    # Wait for response
                    time.sleep(2)
                    print("✅ Attempted to create a supplier")
                except Exception as e:
                    print(f"❌ Error on Suppliers page: {str(e)}")
                
                # Navigate to Templates page
                try:
                    templates_link = driver.find_element(By.XPATH, "//a[contains(text(), 'Templates')]")
                    templates_link.click()
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Add Template')]"))
                    )
                    print("✅ Navigated to Templates page")
                except Exception as e:
                    print(f"❌ Error on Templates page: {str(e)}")
                
                # Navigate to Contracts page
                try:
                    contracts_link = driver.find_element(By.XPATH, "//a[contains(text(), 'Contracts')]")
                    contracts_link.click()
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.XPATH, "//button[contains(text(), 'Generate Contract')]"))
                    )
                    print("✅ Navigated to Contracts page")
                except Exception as e:
                    print(f"❌ Error on Contracts page: {str(e)}")
                
            except TimeoutException:
                print("❌ Login failed, dashboard not loaded")
        except NoSuchElementException:
            print("❌ Not on the login page")
            body_text = driver.find_element(By.TAG_NAME, "body").text
            print(f"Page text: {body_text[:200]}...")
    
    except Exception as e:
        print(f"❌ Frontend test error: {str(e)}")
    
    finally:
        # Close the browser
        if 'driver' in locals():
            driver.quit()

def main():
    # Test backend API
    test_backend_api()
    
    # Test frontend
    # Commented out because Selenium requires Chrome to be installed
    # test_frontend()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
