
import os
from playwright.sync_api import sync_playwright, expect

def test_login(page):
    # Get absolute path to login.html
    cwd = os.getcwd()
    login_path = f"file://{cwd}/login.html"

    print(f"Navigating to: {login_path}")
    page.goto(login_path)

    # Wait for page to load
    page.wait_for_load_state("networkidle")

    # Fill in credentials (using the plaintext password that the user inputs,
    # which the app should now verify against the hash)
    page.fill("#email", "admin@demo.com")
    page.fill("#password", "admin123")

    # Click login
    page.click("button[type='submit']")

    # Expect a success toast
    # The app shows a toast "Login successful! Redirecting..."
    toast = page.locator(".toast.success")
    expect(toast).to_be_visible(timeout=5000)
    print("Success toast appeared")

    # Take screenshot
    page.screenshot(path="verification/login_success.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_login(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
