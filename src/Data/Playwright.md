### Comprehensive Network Interception and Mocking

```csharp
// Route and modify network requests
await page.RouteAsync("**/api/**", async route =>
{
    var request = route.Request;
    
    // Log request details
    Console.WriteLine($"Intercepted: {request.Method} {request.Url}");
    
    //# Playwright .NET API Documentation and Configuration Guide

## Overview

Playwright for .NET is the official .NET implementation of Playwright, a comprehensive framework for web testing and automation. It enables cross-browser automation across **Chromium**, **Firefox**, and **WebKit** with a single, unified API. Built to handle modern web applications, Playwright provides reliable, fast, and capable testing with advanced features including auto-waiting, actionability checks, web-first assertions, and comprehensive configuration options.

### Supported Platforms and Browsers

**Operating Systems:** Windows, macOS, Linux
**Browsers:** 
- Chromium 136.0.7103.25 (including Chrome and Edge)
- WebKit 18.4 (Safari)
- Firefox 137.0

**Test Frameworks:** MSTest, NUnit, xUnit

## Getting Started

### Installation and Setup

#### NuGet Package Installation

```bash
# Core Playwright library
dotnet add package Microsoft.Playwright

# Test framework integrations
dotnet add package Microsoft.Playwright.MSTest    # For MSTest
dotnet add package Microsoft.Playwright.NUnit     # For NUnit  
dotnet add package Microsoft.Playwright.Xunit     # For xUnit

# Required for test adapters
dotnet add package NUnit3TestAdapter              # For NUnit
dotnet add package Microsoft.Playwright.TestAdapter
```

#### Browser Installation

After installing the package, install the required browsers:

```bash
# Build your project first
dotnet build

# Install browsers (PowerShell)
pwsh bin/Debug/net8.0/playwright.ps1 install

# Alternative: Install specific browsers
pwsh bin/Debug/net8.0/playwright.ps1 install chromium firefox webkit

# For CI/CD environments
pwsh bin/Debug/net8.0/playwright.ps1 install --with-deps
```

#### Environment Setup

```bash
# Set environment variables for debugging
export DEBUG=pw:api                    # Enable debug logging
export PWDEBUG=1                       # Enable step-by-step debugging
export HEADED=1                        # Run in headed mode

# Windows PowerShell
$env:DEBUG="pw:api"
$env:PWDEBUG="1" 
$env:HEADED="1"
```

### Basic Example

```csharp
using Microsoft.Playwright;
using System.Threading.Tasks;

class PlaywrightExample
{
    public static async Task Main()
    {
        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.LaunchAsync();
        var page = await browser.NewPageAsync();
        await page.GotoAsync("https://www.microsoft.com");
        
        // Take a screenshot
        await page.ScreenshotAsync(new() { Path = "screenshot.png" });
        
        // Get page title
        var title = await page.TitleAsync();
        Console.WriteLine($"Page title: {title}");
    }
}
```

## Core Concepts

### Playwright Instance

The main Playwright instance provides access to browser types and API request functionality:

```csharp
using var playwright = await Playwright.CreateAsync();

// Access browser types
var chromium = playwright.Chromium;
var firefox = playwright.Firefox;
var webkit = playwright.Webkit;

// Access API testing capabilities
var apiRequest = playwright.APIRequest;

// Access device emulation
var devices = playwright.Devices;
```

### Browser Management

#### Launching Browsers

```csharp
// Launch Chromium
await using var browser = await playwright.Chromium.LaunchAsync(new()
{
    Headless = false,  // Run in headed mode
    SlowMo = 50        // Slow down operations by 50ms
});

// Launch with specific executable path
await using var browser = await playwright.Chromium.LaunchAsync(new()
{
    ExecutablePath = "/path/to/chrome"
});

// Launch Firefox
await using var firefoxBrowser = await playwright.Firefox.LaunchAsync();

// Launch WebKit
await using var webkitBrowser = await playwright.Webkit.LaunchAsync();
```

#### Browser Contexts

Browser contexts provide isolation and can emulate different devices:

```csharp
// Create a new context
await using var context = await browser.NewContextAsync();

// Create context with device emulation
await using var context = await browser.NewContextAsync(playwright.Devices["iPhone 13"]);

// Create context with custom viewport
await using var context = await browser.NewContextAsync(new()
{
    ViewportSize = new() { Width = 1280, Height = 720 },
    UserAgent = "Custom User Agent"
});

// Create context with geolocation
await using var context = await browser.NewContextAsync(new()
{
    Geolocation = new() { Latitude = 37.7749f, Longitude = -122.4194f },
    Permissions = new[] { "geolocation" }
});
```

## Locators and Element Interaction

### Built-in Locators

Playwright provides several built-in locators for robust element selection:

#### Role-based Locators (Recommended)

```csharp
// Locate by ARIA role
await page.GetByRole(AriaRole.Button, new() { Name = "Sign in" }).ClickAsync();
await page.GetByRole(AriaRole.Heading, new() { Name = "Welcome" }).TextContentAsync();
await page.GetByRole(AriaRole.Link, new() { NameRegex = new Regex("learn more", RegexOptions.IgnoreCase) }).ClickAsync();

// Common role examples
await page.GetByRole(AriaRole.Textbox, new() { Name = "Username" }).FillAsync("user123");
await page.GetByRole(AriaRole.Checkbox, new() { Name = "Remember me" }).CheckAsync();
await page.GetByRole(AriaRole.Combobox, new() { Name = "Country" }).SelectOptionAsync("US");
```

#### Label-based Locators

```csharp
// Locate by associated label
await page.GetByLabel("Email Address").FillAsync("user@example.com");
await page.GetByLabel("Password").FillAsync("secretpassword");
await page.GetByLabel("Accept Terms").CheckAsync();
```

#### Text-based Locators

```csharp
// Locate by text content
await page.GetByText("Click me").ClickAsync();
await page.GetByText(new Regex("welcome.*john", RegexOptions.IgnoreCase)).TextContentAsync();

// Exact text match
await page.GetByText("Submit", new() { Exact = true }).ClickAsync();
```

#### Placeholder Locators

```csharp
// Locate by placeholder text
await page.GetByPlaceholder("Enter your email").FillAsync("test@example.com");
await page.GetByPlaceholder("Search...").FillAsync("Playwright");
```

#### Alt Text and Title Locators

```csharp
// Locate images by alt text
await page.GetByAltText("Profile picture").ClickAsync();

// Locate by title attribute
await page.GetByTitle("Close dialog").ClickAsync();
```

#### Test ID Locators

```csharp
// Locate by data-testid attribute
await page.GetByTestId("submit-button").ClickAsync();
await page.GetByTestId("user-profile").IsVisibleAsync();
```

### CSS and XPath Locators

```csharp
// CSS selectors
await page.Locator(".submit-button").ClickAsync();
await page.Locator("#username-input").FillAsync("testuser");
await page.Locator("button[type='submit']").ClickAsync();

// XPath selectors
await page.Locator("xpath=//button[contains(text(), 'Submit')]").ClickAsync();
await page.Locator("xpath=//input[@placeholder='Username']").FillAsync("user");
```

### Locator Filtering and Chaining

```csharp
// Filter locators
await page.Locator("article").Filter(new() { HasText = "Playwright" }).ClickAsync();
await page.GetByRole(AriaRole.Listitem).Filter(new() { HasText = "Product" }).ClickAsync();

// Chaining locators
await page.Locator(".sidebar").GetByRole(AriaRole.Button, new() { Name = "Subscribe" }).ClickAsync();
await page.Locator("#main-content").GetByText("Learn more").ClickAsync();

// Nth element selection
await page.GetByRole(AriaRole.Button).First.ClickAsync();
await page.GetByRole(AriaRole.Button).Last.ClickAsync();
await page.GetByRole(AriaRole.Button).Nth(2).ClickAsync();
```

## Actions and Interactions

### Basic Actions

```csharp
// Click actions
await page.GetByRole(AriaRole.Button, new() { Name = "Submit" }).ClickAsync();
await page.GetByText("Link").ClickAsync(new() { Button = MouseButton.Right }); // Right click
await page.GetByText("Element").DblClickAsync(); // Double click

// Fill and clear text
await page.GetByLabel("Username").FillAsync("testuser");
await page.GetByLabel("Username").ClearAsync();

// Type character by character
await page.GetByLabel("Search").TypeAsync("Playwright", new() { Delay = 100 });

// Check and uncheck
await page.GetByRole(AriaRole.Checkbox, new() { Name = "Agree" }).CheckAsync();
await page.GetByRole(AriaRole.Checkbox, new() { Name = "Agree" }).UncheckAsync();

// Select options
await page.GetByLabel("Country").SelectOptionAsync("US");
await page.GetByLabel("Country").SelectOptionAsync(new[] { "US", "CA" });

// File uploads
await page.GetByLabel("Upload").SetInputFilesAsync("path/to/file.pdf");
await page.GetByLabel("Upload").SetInputFilesAsync(new[] { "file1.pdf", "file2.pdf" });
```

### Keyboard and Mouse Interactions

```csharp
// Keyboard shortcuts
await page.Keyboard.PressAsync("Enter");
await page.Keyboard.PressAsync("Control+A");
await page.Keyboard.TypeAsync("Hello World");

// Mouse actions
await page.Mouse.ClickAsync(100, 200);
await page.Mouse.DblClickAsync(100, 200);
await page.Mouse.MoveAsync(100, 200);
await page.Mouse.DownAsync();
await page.Mouse.UpAsync();

// Drag and drop
await page.GetByText("Item 1").DragToAsync(page.GetByText("Drop Zone"));

// Hover
await page.GetByRole(AriaRole.Button, new() { Name = "Menu" }).HoverAsync();
```

### Advanced Interactions

```csharp
// Focus and blur
await page.GetByLabel("Username").FocusAsync();
await page.GetByLabel("Username").BlurAsync();

// Scroll actions
await page.GetByText("Bottom of page").ScrollIntoViewIfNeededAsync();

// Force actions (bypass actionability checks)
await page.GetByText("Hidden button").ClickAsync(new() { Force = true });

// Wait for specific state
await page.GetByText("Loading...").WaitForAsync(new() { State = WaitForSelectorState.Hidden });
```

## Assertions and Expectations

### Element State Assertions

```csharp
// Visibility assertions
await Expect(page.GetByText("Welcome")).ToBeVisibleAsync();
await Expect(page.GetByText("Error")).ToBeHiddenAsync();

// Enabled/disabled state
await Expect(page.GetByRole(AriaRole.Button, new() { Name = "Submit" })).ToBeEnabledAsync();
await Expect(page.GetByRole(AriaRole.Button, new() { Name = "Submit" })).ToBeDisabledAsync();

// Checked state
await Expect(page.GetByRole(AriaRole.Checkbox, new() { Name = "Agree" })).ToBeCheckedAsync();
await Expect(page.GetByRole(AriaRole.Checkbox, new() { Name = "Agree" })).Not.ToBeCheckedAsync();

// Focus state
await Expect(page.GetByLabel("Username")).ToBeFocusedAsync();

// Editable state
await Expect(page.GetByLabel("Description")).ToBeEditableAsync();
```

### Content Assertions

```csharp
// Text content
await Expect(page.GetByRole(AriaRole.Heading)).ToHaveTextAsync("Welcome");
await Expect(page.GetByTestId("message")).ToContainTextAsync("Success");

// Attribute assertions
await Expect(page.GetByRole(AriaRole.Link)).ToHaveAttributeAsync("href", "https://example.com");
await Expect(page.GetByLabel("Email")).ToHaveValueAsync("user@example.com");

// Count assertions
await Expect(page.GetByRole(AriaRole.Listitem)).ToHaveCountAsync(5);

// URL and title assertions
await Expect(page).ToHaveURLAsync("https://example.com/dashboard");
await Expect(page).ToHaveTitleAsync("Dashboard");
```

### Custom Timeouts

```csharp
// Custom timeout for assertions
await Expect(page.GetByText("Loading...")).ToBeHiddenAsync(new() { Timeout = 10000 });

// Set default timeout
page.SetDefaultTimeout(30000);
```

## API Testing

### Setting Up API Context

```csharp
using Microsoft.Playwright;
using Microsoft.Playwright.MSTest;

[TestClass]
public class ApiTests : PlaywrightTest
{
    private IAPIRequestContext Request = null!;

    [TestInitialize]
    public async Task SetUpAPITesting()
    {
        var headers = new Dictionary<string, string>
        {
            { "Accept", "application/json" },
            { "Authorization", "Bearer " + Environment.GetEnvironmentVariable("API_TOKEN") }
        };

        Request = await Playwright.APIRequest.NewContextAsync(new()
        {
            BaseURL = "https://api.example.com",
            ExtraHTTPHeaders = headers,
        });
    }

    [TestCleanup]
    public async Task TearDownAPITesting()
    {
        await Request.DisposeAsync();
    }
}
```

### Making API Requests

```csharp
// GET request
var response = await Request.GetAsync("/users/123");
await Expect(response).ToBeOKAsync();
var userData = await response.JsonAsync();

// POST request with JSON data
var postData = new Dictionary<string, object>
{
    { "name", "John Doe" },
    { "email", "john@example.com" }
};

var createResponse = await Request.PostAsync("/users", new()
{
    DataObject = postData
});
await Expect(createResponse).ToBeOKAsync();

// PUT request
var updateData = new { name = "Jane Doe" };
var updateResponse = await Request.PutAsync("/users/123", new()
{
    DataObject = updateData
});

// DELETE request
var deleteResponse = await Request.DeleteAsync("/users/123");
await Expect(deleteResponse).ToBeOKAsync();
```

### Response Validation

```csharp
// Status code validation
await Expect(response).ToBeOKAsync(); // 200-299
await Expect(response).ToBeOKAsync(); // Exactly 200

// Response body validation
var jsonResponse = await response.JsonAsync();
var user = jsonResponse?.GetProperty("user");
Assert.AreEqual("John Doe", user?.GetProperty("name").GetString());

// Response headers
var contentType = response.Headers["content-type"];
Assert.IsTrue(contentType.Contains("application/json"));
```

## Configuration Management

### .runsettings Configuration File

The `.runsettings` file provides comprehensive configuration for Playwright tests, allowing you to set browser options, launch parameters, and test execution settings.

#### Complete .runsettings Example

```xml
<?xml version="1.0" encoding="utf-8"?>
<RunSettings>
  <!-- General test run configuration -->
  <RunConfiguration>
    <EnvironmentVariables>
      <!-- Enable debugging -->
      <DEBUG>pw:api</DEBUG>
      <PWDEBUG>1</PWDEBUG>
    </EnvironmentVariables>
    <TargetPlatform>x64</TargetPlatform>
    <TreatTestAdapterErrorsAsWarnings>false</TreatTestAdapterErrorsAsWarnings>
  </RunConfiguration>

  <!-- Playwright-specific settings -->
  <Playwright>
    <!-- Browser selection: chromium, firefox, webkit -->
    <BrowserName>chromium</BrowserName>
    
    <!-- Global timeout for expect assertions (milliseconds) -->
    <ExpectTimeout>5000</ExpectTimeout>
    
    <!-- Browser launch options -->
    <LaunchOptions>
      <!-- Run in headed/headless mode -->
      <Headless>false</Headless>
      
      <!-- Browser channel (chrome, msedge, firefox-beta, etc.) -->
      <Channel>msedge</Channel>
      
      <!-- Slow down operations for debugging -->
      <SlowMo>100</SlowMo>
      
      <!-- Browser launch timeout -->
      <Timeout>30000</Timeout>
      
      <!-- Enable developer tools -->
      <Devtools>true</Devtools>
      
      <!-- Custom executable path -->
      <ExecutablePath>C:\Program Files\Google\Chrome\Application\chrome.exe</ExecutablePath>
      
      <!-- Additional browser arguments -->
      <Args>
        <Arg>--start-maximized</Arg>
        <Arg>--disable-web-security</Arg>
        <Arg>--disable-features=VizDisplayCompositor</Arg>
      </Args>
      
      <!-- Downloads directory -->
      <DownloadsPath>C:\temp\downloads</DownloadsPath>
      
      <!-- Proxy configuration -->
      <Proxy>
        <Server>http://proxy.company.com:8080</Server>
        <Username>proxy_user</Username>
        <Password>proxy_pass</Password>
        <Bypass>.localhost,.local</Bypass>
      </Proxy>
      
      <!-- Ignore default arguments -->
      <IgnoreDefaultArgs>false</IgnoreDefaultArgs>
      <IgnoreHTTPSErrors>true</IgnoreHTTPSErrors>
      
      <!-- Tracing directory -->
      <TracesDir>traces</TracesDir>
    </LaunchOptions>
  </Playwright>

  <!-- MSTest configuration -->
  <MSTest>
    <Parallelize>
      <Workers>4</Workers>
      <Scope>ClassLevel</Scope>
    </Parallelize>
  </MSTest>

  <!-- NUnit configuration -->
  <NUnit>
    <NumberOfTestWorkers>8</NumberOfTestWorkers>
  </NUnit>

  <!-- Test run parameters -->
  <TestRunParameters>
    <Parameter name="BaseUrl" value="https://example.com" />
    <Parameter name="ApiKey" value="test-api-key" />
    <Parameter name="Environment" value="staging" />
  </TestRunParameters>
</RunSettings>
```

#### Using .runsettings Files

```bash
# Specify runsettings file during test execution
dotnet test --settings:playwright.runsettings

# Override specific settings via CLI
dotnet test --settings:test.runsettings -- Playwright.BrowserName=firefox
dotnet test -- Playwright.LaunchOptions.Headless=false
dotnet test -- MSTest.Parallelize.Workers=2

# Multiple browser configurations
dotnet test --settings:chromium.runsettings
dotnet test --settings:firefox.runsettings  
dotnet test --settings:webkit.runsettings
```

#### Browser-Specific .runsettings Files

**chromium.runsettings:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<RunSettings>
  <Playwright>
    <BrowserName>chromium</BrowserName>
    <LaunchOptions>
      <Channel>chrome</Channel>
      <Args>
        <Arg>--disable-web-security</Arg>
        <Arg>--allow-running-insecure-content</Arg>
      </Args>
    </LaunchOptions>
  </Playwright>
</RunSettings>
```

**firefox.runsettings:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<RunSettings>
  <Playwright>
    <BrowserName>firefox</BrowserName>
    <LaunchOptions>
      <Headless>false</Headless>
      <SlowMo>50</SlowMo>
    </LaunchOptions>
  </Playwright>
</RunSettings>
```

### Programmatic Configuration

#### BrowserTypeLaunchOptions - Complete Configuration

```csharp
var launchOptions = new BrowserTypeLaunchOptions
{
    // Basic browser settings
    Headless = false,                    // Run in headed mode
    Channel = "msedge",                  // Use specific browser channel
    SlowMo = 100,                        // Slow down operations (ms)
    Timeout = 60000,                     // Launch timeout (ms)
    
    // Developer tools and debugging
    Devtools = true,                     // Open DevTools
    
    // Custom browser executable
    ExecutablePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe",
    
    // Browser arguments
    Args = new[]
    {
        "--start-maximized",             // Start maximized
        "--disable-web-security",       // Disable web security
        "--disable-features=VizDisplayCompositor",
        "--no-sandbox",                  // For Linux environments
        "--disable-dev-shm-usage",      // For Docker environments
        "--remote-debugging-port=9222"  // Enable remote debugging
    },
    
    // Downloads configuration
    DownloadsPath = @"C:\temp\downloads",
    
    // Proxy configuration
    Proxy = new Proxy
    {
        Server = "http://proxy.company.com:8080",
        Username = "proxy_user",
        Password = "proxy_pass",
        Bypass = "*.localhost,*.local"
    },
    
    // Security settings
    IgnoreHTTPSErrors = true,
    IgnoreDefaultArgs = false,           // Use default browser args
    
    // Advanced options
    ChromiumSandbox = false,             // Disable Chromium sandbox
    TracesDir = "traces",                // Directory for traces
    Env = new Dictionary<string, string> // Environment variables
    {
        { "NODE_ENV", "test" },
        { "API_URL", "https://api.test.com" }
    }
};

// Launch browser with options
await using var browser = await playwright.Chromium.LaunchAsync(launchOptions);
```

#### BrowserNewContextOptions - Complete Configuration

```csharp
var contextOptions = new BrowserNewContextOptions
{
    // Viewport and screen settings
    ViewportSize = new ViewportSize { Width = 1920, Height = 1080 },
    ScreenSize = new ScreenSize { Width = 1920, Height = 1080 },
    DeviceScaleFactor = 2,
    IsMobile = false,
    HasTouch = false,
    
    // User agent and locale
    UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Locale = "en-US",
    TimezoneId = "America/New_York",
    
    // Permissions and features
    Permissions = new[] { "geolocation", "notifications", "camera", "microphone" },
    Geolocation = new Geolocation { Latitude = 40.7128f, Longitude = -74.0060f },
    
    // Media and accessibility
    ColorScheme = ColorScheme.Dark,
    ReducedMotion = ReducedMotion.Reduce,
    ForcedColors = ForcedColors.Active,
    
    // JavaScript and security
    JavaScriptEnabled = true,
    BypassCSP = true,
    IgnoreHTTPSErrors = true,
    
    // Storage and cookies
    AcceptDownloads = true,
    StorageState = "auth-state.json",    // Load authentication state
    
    // HTTP credentials
    HttpCredentials = new HttpCredentials
    {
        Username = "testuser",
        Password = "testpass",
        Origin = "https://example.com"
    },
    
    // Client certificates
    ClientCertificates = new[]
    {
        new ClientCertificate
        {
            Origin = "https://secure.example.com",
            CertPath = "client-cert.pem",
            KeyPath = "client-key.pem",
            Passphrase = "cert-password"
        }
    },
    
    // Base URL for relative navigation
    BaseURL = "https://example.com",
    
    // Extra HTTP headers
    ExtraHTTPHeaders = new Dictionary<string, string>
    {
        { "Authorization", "Bearer token123" },
        { "X-Custom-Header", "custom-value" },
        { "Accept-Language", "en-US,en;q=0.9" }
    },
    
    // Recording options
    RecordVideoDir = "videos",
    RecordVideoSize = new RecordVideoSize { Width = 1280, Height = 720 },
    
    // HAR recording
    RecordHarPath = "requests.har",
    RecordHarContent = HarContentPolicy.Attach,
    RecordHarMode = HarMode.Minimal,
    RecordHarUrlFilter = "**/*.{js,css,png,jpg}",
    
    // Service workers
    ServiceWorkers = ServiceWorkersPolicy.Allow,
    
    // Strict selectors
    StrictSelectors = true,
    
    // Proxy (context-specific)
    Proxy = new Proxy
    {
        Server = "http://context-proxy.com:8080"
    }
};

await using var context = await browser.NewContextAsync(contextOptions);
```

```csharp
// Navigate to URL
await page.GotoAsync("https://example.com");
await page.GotoAsync("https://example.com", new() { WaitUntil = WaitUntilState.NetworkIdle });

// Navigation actions
await page.GoBackAsync();
await page.GoForwardAsync();
await page.ReloadAsync();

// Wait for load states
await page.WaitForLoadStateAsync(LoadState.NetworkIdle);
await page.WaitForLoadStateAsync(LoadState.DOMContentLoaded);
```

### Comprehensive Network Interception and Mocking

```csharp
// Route and modify network requests
await page.RouteAsync("**/api/**", async route =>
{
    var request = route.Request;
    
    // Log request details
    Console.WriteLine($"Intercepted: {request.Method} {request.Url}");
    
    // Modify request headers
    var headers = new Dictionary<string, string>(request.Headers)
    {
        ["Authorization"] = "Bearer mock-token",
        ["X-Custom-Header"] = "test-value"
    };
    
    // Continue with modified request
    await route.ContinueAsync(new()
    {
        Headers = headers,
        PostData = request.PostData // Can modify POST data too
    });
});

// Mock API responses
await page.RouteAsync("**/api/users", async route =>
{
    if (route.Request.Method == "GET")
    {
        // Return mock data
        await route.FulfillAsync(new()
        {
            Status = 200,
            ContentType = "application/json",
            Body = """
            {
                "users": [
                    {"id": 1, "name": "John Doe", "email": "john@example.com"},
                    {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
                ]
            }
            """
        });
    }
    else
    {
        await route.ContinueAsync();
    }
});

// Block specific resource types
await page.RouteAsync("**/*.{png,jpg,jpeg,gif,svg,css}", route => route.AbortAsync());

// Advanced request matching with regex
await page.RouteAsync(new Regex(@".*\.(png|jpg|jpeg)$"), route => route.AbortAsync());

// Route with predicate function
await page.RouteAsync(request => 
    request.Url.Contains("analytics") || request.Url.Contains("tracking"), 
    route => route.AbortAsync());

// Monitor network events
page.Request += (_, request) => 
{
    Console.WriteLine($"→ {request.Method} {request.Url}");
    if (request.PostData != null)
        Console.WriteLine($"  Data: {request.PostData}");
};

page.Response += (_, response) => 
{
    Console.WriteLine($"← {response.Status} {response.Url}");
    Console.WriteLine($"  Headers: {string.Join(", ", response.Headers.Select(h => $"{h.Key}: {h.Value}"))}");
};

page.RequestFailed += (_, request) =>
{
    Console.WriteLine($"✗ Failed: {request.Url} - {request.Failure}");
};

// HAR file recording for network analysis
await context.RouteFromHARAsync("network-recording.har", new()
{
    Url = "**/api/**",
    Update = true // Update HAR file with new requests
});
```

### Advanced Waiting and Synchronization

```csharp
// Wait for specific elements
await page.WaitForSelectorAsync(".dynamic-content");
await page.WaitForSelectorAsync("text=Success", new() { Timeout = 10000 });

// Wait for element to be in specific state
await page.WaitForSelectorAsync("button", new() { State = WaitForSelectorState.Visible });
await page.WaitForSelectorAsync(".loading", new() { State = WaitForSelectorState.Hidden });

// Wait for function to return truthy value
await page.WaitForFunctionAsync("() => window.loadingComplete === true");
await page.WaitForFunctionAsync("() => document.querySelectorAll('.item').length > 5");

// Wait for console messages
var consoleMessageTask = page.WaitForConsoleMessageAsync();
await page.ClickAsync("#trigger-console");
var message = await consoleMessageTask;
Console.WriteLine($"Console: {message.Text}");

// Wait for downloads
var downloadTask = page.WaitForDownloadAsync();
await page.ClickAsync("#download-button");
var download = await downloadTask;
await download.SaveAsAsync("downloaded-file.pdf");

// Wait for popups/new windows
var popupTask = page.WaitForPopupAsync();
await page.ClickAsync("#open-popup");
var popup = await popupTask;
await popup.WaitForLoadStateAsync();

// Wait for file chooser
var fileChooserTask = page.WaitForFileChooserAsync();
await page.ClickAsync("#file-upload");
var fileChooser = await fileChooserTask;
await fileChooser.SetFilesAsync("upload.txt");

// Combined waiting with timeout
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));
try
{
    await page.WaitForSelectorAsync(".slow-element", new() 
    { 
        Timeout = 30000 
    });
}
catch (TimeoutException)
{
    Console.WriteLine("Element did not appear within timeout");
}

// Custom waiting with polling
await page.WaitForFunctionAsync(@"
    () => {
        const element = document.querySelector('.status');
        return element && element.textContent.includes('Complete');
    }", 
    new() { PollingInterval = 1000, Timeout = 30000 }
);
```

### Screenshots, Videos, and Visual Testing

```csharp
// Page screenshots
await page.ScreenshotAsync(new() { Path = "full-page.png" });
await page.ScreenshotAsync(new() 
{ 
    Path = "screenshot.png",
    FullPage = true,                    // Capture entire page
    Quality = 90,                       // JPEG quality (1-100)
    Type = ScreenshotType.Jpeg,
    Clip = new() { X = 0, Y = 0, Width = 800, Height = 600 } // Specific region
});

// Element screenshots
await page.GetByTestId("chart").ScreenshotAsync(new() { Path = "chart.png" });
await page.Locator(".dashboard").ScreenshotAsync(new() 
{ 
    Path = "dashboard.png",
    Animations = ScreenshotAnimations.Disabled,  // Disable animations
    Caret = ScreenshotCaret.Hide,               // Hide text cursor
    Scale = ScreenshotScale.DeviceScaleFactor,  // Use device scale
    Mask = new[] { page.Locator(".sensitive-data") } // Mask sensitive areas
});

// Video recording setup
await using var context = await browser.NewContextAsync(new()
{
    RecordVideoDir = "videos/",
    RecordVideoSize = new() { Width = 1280, Height = 720 }
});

var page = await context.NewPageAsync();
// ... perform test actions ...
await page.CloseAsync();

// Video will be saved automatically
var videoPath = await page.Video!.PathAsync();
Console.WriteLine($"Video saved to: {videoPath}");

// Manual video operations
await page.Video!.SaveAsAsync("custom-name.webm");
await page.Video!.DeleteAsync();

// Visual comparison testing
var screenshot = await page.ScreenshotAsync();
// Compare with baseline image using your preferred image comparison library
// Example: ImageSharp, OpenCV, or custom comparison logic
```

### Debugging and Development Tools

```csharp
// Step-by-step debugging
await page.PauseAsync(); // Pauses execution and opens Playwright Inspector

// Trace collection for post-mortem analysis
await context.Tracing.StartAsync(new()
{
    Screenshots = true,
    Snapshots = true,
    Sources = true
});

// ... test actions ...

await context.Tracing.StopAsync(new() 
{ 
    Path = "trace.zip" 
});

// Console monitoring
page.Console += (_, msg) =>
{
    var color = msg.Type switch
    {
        "error" => ConsoleColor.Red,
        "warning" => ConsoleColor.Yellow,
        "info" => ConsoleColor.Cyan,
        _ => ConsoleColor.White
    };
    
    Console.ForegroundColor = color;
    Console.WriteLine($"[{msg.Type.ToUpper()}] {msg.Text}");
    Console.ResetColor();
    
    // Log arguments
    foreach (var arg in msg.Args)
    {
        Console.WriteLine($"  Arg: {arg}");
    }
};

// Page error monitoring
page.PageError += (_, error) =>
{
    Console.WriteLine($"Page Error: {error.Message}");
    Console.WriteLine($"Stack: {error.Stack}");
};

// Request/Response logging with detailed information
page.Request += (_, request) =>
{
    Console.WriteLine($"→ {request.Method} {request.Url}");
    Console.WriteLine($"  Headers: {string.Join(", ", request.Headers.Select(h => $"{h.Key}={h.Value}"))}");
    if (request.PostData != null)
        Console.WriteLine($"  Body: {request.PostData}");
};

page.Response += (_, response) =>
{
    Console.WriteLine($"← {response.Status} {response.StatusText} {response.Url}");
    Console.WriteLine($"  Size: {response.Headers.GetValueOrDefault("content-length", "unknown")} bytes");
    Console.WriteLine($"  Type: {response.Headers.GetValueOrDefault("content-type", "unknown")}");
};

// Slow motion for visual debugging
await using var debugBrowser = await playwright.Chromium.LaunchAsync(new()
{
    Headless = false,
    SlowMo = 1000,        // 1 second delay between actions
    Devtools = true       // Open DevTools
});

// Custom debug helpers
public static class DebugHelpers
{
    public static async Task HighlightElementAsync(ILocator locator, int durationMs = 2000)
    {
        await locator.EvaluateAsync(@"
            element => {
                element.style.outline = '3px solid red';
                element.style.backgroundColor = 'yellow';
                setTimeout(() => {
                    element.style.outline = '';
                    element.style.backgroundColor = '';
                }, arguments[1]);
            }", durationMs);
    }
    
    public static async Task LogElementInfoAsync(ILocator locator)
    {
        var info = await locator.EvaluateAsync<object>(@"
            element => ({
                tagName: element.tagName,
                id: element.id,
                className: element.className,
                textContent: element.textContent?.trim(),
                visible: !element.hidden && element.offsetParent !== null,
                bounds: element.getBoundingClientRect()
            })
        ");
        Console.WriteLine($"Element info: {info}");
    }
}
```

### Performance Monitoring and Metrics

```csharp
// Performance timing
var performanceEntry = await page.EvaluateAsync<object>(@"
    () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        return {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
            responseTime: perfData.responseEnd - perfData.requestStart,
            dnsLookup: perfData.domainLookupEnd - perfData.domainLookupStart,
            tcpConnect: perfData.connectEnd - perfData.connectStart
        };
    }
");

Console.WriteLine($"Performance metrics: {performanceEntry}");

// Memory usage monitoring
var memoryUsage = await page.EvaluateAsync<object>(@"
    () => {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
");

// Network performance
var networkMetrics = new List<object>();
page.Response += (_, response) =>
{
    var metrics = new
    {
        Url = response.Url,
        Status = response.Status,
        Size = response.Headers.GetValueOrDefault("content-length", "0"),
        Type = response.Headers.GetValueOrDefault("content-type", "unknown"),
        Timing = DateTime.Now
    };
    networkMetrics.Add(metrics);
};

// Core Web Vitals
var webVitals = await page.EvaluateAsync<object>(@"
    () => new Promise((resolve) => {
        const vitals = {};
        
        // LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            vitals.lcp = entries[entries.length - 1].startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // FID (First Input Delay) - approximation
        new PerformanceObserver((list) => {
            vitals.fid = list.getEntries()[0].processingStart - list.getEntries()[0].startTime;
        }).observe({ entryTypes: ['first-input'] });
        
        // CLS (Cumulative Layout Shift)
        let clsValue = 0;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => resolve(vitals), 5000);
    })
");

Console.WriteLine($"Core Web Vitals: {webVitals}");
```

### Multi-Context and Multi-Page Management

```csharp
// Multiple browser contexts for isolation
await using var userContext = await browser.NewContextAsync(new()
{
    UserAgent = "User Agent",
    ExtraHTTPHeaders = new() { { "X-User-Type", "regular" } }
});

await using var adminContext = await browser.NewContextAsync(new()
{
    UserAgent = "Admin Agent", 
    ExtraHTTPHeaders = new() { { "X-User-Type", "admin" } }
});

// Multiple pages within context
var userPage1 = await userContext.NewPageAsync();
var userPage2 = await userContext.NewPageAsync();
var adminPage = await adminContext.NewPageAsync();

// Parallel operations
var tasks = new[]
{
    userPage1.GotoAsync("https://example.com/user-dashboard"),
    userPage2.GotoAsync("https://example.com/user-profile"),
    adminPage.GotoAsync("https://example.com/admin-panel")
};

await Task.WhenAll(tasks);

// Context-level operations
await userContext.AddCookiesAsync(new[]
{
    new Cookie
    {
        Name = "session",
        Value = "user-session-token",
        Domain = "example.com",
        Path = "/"
    }
});

// Share storage state between contexts
var userState = await userContext.StorageStateAsync();
await using var anotherUserContext = await browser.NewContextAsync(new()
{
    StorageState = userState
});

// Handle new pages/popups across contexts
userContext.Page += (_, page) =>
{
    Console.WriteLine($"New page opened: {page.Url}");
    page.Close(); // Auto-close popups if needed
};

// Context cleanup
await Task.WhenAll(
    userContext.CloseAsync(),
    adminContext.CloseAsync()
);
```

### Error Handling and Resilience

```csharp
// Comprehensive error handling
public static async Task<T> RetryAsync<T>(Func<Task<T>> operation, int maxRetries = 3, int delayMs = 1000)
{
    Exception lastException = null;
    
    for (int i = 0; i < maxRetries; i++)
    {
        try
        {
            return await operation();
        }
        catch (TimeoutException ex) when (i < maxRetries - 1)
        {
            lastException = ex;
            Console.WriteLine($"Attempt {i + 1} failed with timeout, retrying in {delayMs}ms...");
            await Task.Delay(delayMs);
            delayMs *= 2; // Exponential backoff
        }
        catch (PlaywrightException ex) when (ex.Message.Contains("Element not found") && i < maxRetries - 1)
        {
            lastException = ex;
            Console.WriteLine($"Element not found on attempt {i + 1}, retrying...");
            await Task.Delay(delayMs);
        }
    }
    
    throw lastException ?? new Exception("Operation failed after all retries");
}

// Usage example
var element = await RetryAsync(async () =>
{
    var locator = page.GetByTestId("dynamic-element");
    await Expect(locator).ToBeVisibleAsync(new() { Timeout = 5000 });
    return locator;
});

// Graceful error handling in tests
[TestMethod]
public async Task TestWithErrorHandling()
{
    try
    {
        await page.GotoAsync("https://example.com");
        await page.GetByText("Submit").ClickAsync();
        await Expect(page.GetByText("Success")).ToBeVisibleAsync();
    }
    catch (TimeoutException)
    {
        // Take diagnostic screenshot
        await page.ScreenshotAsync(new() { Path = $"error-{DateTime.Now:yyyyMMdd-HHmmss}.png" });
        
        // Log page state
        var title = await page.TitleAsync();
        var url = page.Url;
        Console.WriteLine($"Test failed on page: {title} ({url})");
        
        // Check for error messages
        var errorElements = page.Locator(".error, .alert-danger, [role='alert']");
        var errorCount = await errorElements.CountAsync();
        if (errorCount > 0)
        {
            for (int i = 0; i < errorCount; i++)
            {
                var errorText = await errorElements.Nth(i).TextContentAsync();
                Console.WriteLine($"Error message {i + 1}: {errorText}");
            }
        }
        
        throw;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Unexpected error: {ex.Message}");
        await page.ScreenshotAsync(new() { Path = $"unexpected-error-{DateTime.Now:yyyyMMdd-HHmmss}.png" });
        throw;
    }
}

// Custom exception types
public class ElementNotInteractableException : Exception
{
    public ElementNotInteractableException(string selector, string action) 
        : base($"Element '{selector}' is not interactable for action '{action}'") { }
}

public class PageLoadException : Exception
{
    public string Url { get; }
    public int StatusCode { get; }
    
    public PageLoadException(string url, int statusCode) 
        : base($"Failed to load page '{url}' with status code {statusCode}")
    {
        Url = url;
        StatusCode = statusCode;
    }
}
```

This comprehensive documentation covers all the essential aspects of Playwright .NET with extensive configuration options, real-world examples, and best practices for robust test automation.

## Testing Patterns and Best Practices

### Page Object Model

```csharp
public class LoginPage
{
    private readonly IPage _page;

    public LoginPage(IPage page)
    {
        _page = page;
    }

    public ILocator UsernameInput => _page.GetByLabel("Username");
    public ILocator PasswordInput => _page.GetByLabel("Password");
    public ILocator LoginButton => _page.GetByRole(AriaRole.Button, new() { Name = "Login" });
    public ILocator ErrorMessage => _page.GetByTestId("error-message");

    public async Task LoginAsync(string username, string password)
    {
        await UsernameInput.FillAsync(username);
        await PasswordInput.FillAsync(password);
        await LoginButton.ClickAsync();
    }

    public async Task ExpectErrorAsync(string message)
    {
        await Expect(ErrorMessage).ToBeVisibleAsync();
        await Expect(ErrorMessage).ToHaveTextAsync(message);
    }
}
```

### MSTest Integration

```csharp
using Microsoft.Playwright.MSTest;

[TestClass]
public class WebTests : PageTest
{
    [TestMethod]
    public async Task ShouldDisplayWelcomeMessage()
    {
        await Page.GotoAsync("https://example.com");
        await Page.GetByLabel("Username").FillAsync("testuser");
        await Page.GetByLabel("Password").FillAsync("password");
        await Page.GetByRole(AriaRole.Button, new() { Name = "Login" }).ClickAsync();
        
        await Expect(Page.GetByText("Welcome, testuser!")).ToBeVisibleAsync();
    }

    [TestMethod]
    public async Task ShouldHandleLoginError()
    {
        await Page.GotoAsync("https://example.com");
        await Page.GetByLabel("Username").FillAsync("invalid");
        await Page.GetByLabel("Password").FillAsync("invalid");
        await Page.GetByRole(AriaRole.Button, new() { Name = "Login" }).ClickAsync();
        
        await Expect(Page.GetByText("Invalid credentials")).ToBeVisibleAsync();
    }
}
```

### Parallel Test Execution

```csharp
[TestClass]
public class ParallelTests : PlaywrightTest
{
    [TestMethod]
    public async Task Test1()
    {
        await using var browser = await Playwright.Chromium.LaunchAsync();
        var page = await browser.NewPageAsync();
        // Test logic
    }

    [TestMethod]
    public async Task Test2()
    {
        await using var browser = await Playwright.Firefox.LaunchAsync();
        var page = await browser.NewPageAsync();
        // Test logic
    }
}
```

## Configuration and Options

### Launch Options

```csharp
var launchOptions = new BrowserTypeLaunchOptions
{
    Headless = false,
    SlowMo = 50,
    Devtools = true,
    Args = new[] { "--start-maximized" },
    DownloadsPath = "downloads/",
    Timeout = 30000
};

await using var browser = await playwright.Chromium.LaunchAsync(launchOptions);
```

### Context Options

```csharp
var contextOptions = new BrowserNewContextOptions
{
    ViewportSize = new() { Width = 1920, Height = 1080 },
    UserAgent = "Custom User Agent",
    Locale = "en-US",
    TimezoneId = "America/New_York",
    Permissions = new[] { "notifications", "geolocation" },
    ColorScheme = ColorScheme.Dark,
    ReducedMotion = ReducedMotion.Reduce,
    RecordVideoDir = "videos/",
    RecordVideoSize = new() { Width = 1280, Height = 720 }
};

await using var context = await browser.NewContextAsync(contextOptions);
```

## Error Handling and Debugging

### Exception Handling

```csharp
try
{
    await page.GetByText("Non-existent element").ClickAsync(new() { Timeout = 5000 });
}
catch (TimeoutException ex)
{
    Console.WriteLine($"Element not found: {ex.Message}");
}
catch (PlaywrightException ex)
{
    Console.WriteLine($"Playwright error: {ex.Message}");
}
```

### Debugging Features

```csharp
// Pause execution for debugging
await page.PauseAsync();

// Trace collection
await using var context = await browser.NewContextAsync(new()
{
    RecordVideoDir = "videos/"
});

await context.Tracing.StartAsync(new()
{
    Screenshots = true,
    Snapshots = true,
    Sources = true
});

// Your test code here

await context.Tracing.StopAsync(new() { Path = "trace.zip" });
```

### Console and Network Monitoring

```csharp
// Monitor console messages
page.Console += (_, msg) => Console.WriteLine($"Console {msg.Type}: {msg.Text}");

// Monitor network activity
page.Request += (_, request) => Console.WriteLine($"Request: {request.Method} {request.Url}");
page.Response += (_, response) => Console.WriteLine($"Response: {response.Status} {response.Url}");

// Monitor page errors
page.PageError += (_, error) => Console.WriteLine($"Page error: {error}");
```

This comprehensive documentation covers the essential aspects of Playwright .NET API, providing practical examples and best practices for effective web automation and testing.