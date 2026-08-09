#!/usr/bin/env tsx
/**
 * Test Wikimedia Commons API Access
 * 
 * Tests the API endpoints we'll use for station images.
 */

async function testWikimediaApi() {
  console.log('🧪 Testing Wikimedia Commons API...\n');
  
  const API_URL = 'https://commons.wikimedia.org/w/api.php';
  const USER_AGENT = 'TehranMetroApp/1.0 (https://github.com/tehran-metro-app)';
  
  // Test 1: Basic API connectivity
  console.log('1. Testing basic API connectivity...');
  try {
    const response = await fetch(`${API_URL}?action=query&format=json&meta=siteinfo`, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`   ✅ API is accessible`);
    console.log(`   Site name: ${data.query?.general?.sitename || 'Unknown'}`);
  } catch (error) {
    console.log(`   ❌ Failed: ${(error as Error).message}`);
    return;
  }
  
  // Test 2: Search for Tehran Metro category
  console.log('\n2. Searching for Tehran Metro category...');
  try {
    const category = 'Category:Tehran_Metro_stations';
    const encodedCategory = encodeURIComponent(category);
    const url = `${API_URL}?action=query&format=json&list=categorymembers&cmtitle=${encodedCategory}&cmlimit=10`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    const data = await response.json();
    
    if (data.query?.categorymembers) {
      console.log(`   ✅ Found category with ${data.query.categorymembers.length} members`);
      console.log('   First 5 members:');
      data.query.categorymembers.slice(0, 5).forEach((member: any, i: number) => {
        console.log(`   ${i + 1}. ${member.title}`);
      });
    } else {
      console.log('   ⚠️  Category found but no members listed');
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${(error as Error).message}`);
  }
  
  // Test 3: Test a specific station category (Tajrish)
  console.log('\n3. Testing Tajrish Metro Station category...');
  try {
    const category = 'Category:Tajrish Metro Station';
    const encodedCategory = encodeURIComponent(category);
    const url = `${API_URL}?action=query&format=json&generator=categorymembers&gcmtitle=${encodedCategory}&gcmlimit=5&gcmtype=file&prop=imageinfo&iiprop=url|extmetadata|size&iiextmetadatafilter=LicenseShortName|Artist`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    const data = await response.json();
    
    if (data.query?.pages) {
      const pages = Object.values(data.query.pages) as any[];
      console.log(`   ✅ Found ${pages.length} image(s) in category`);
      
      pages.forEach((page, i) => {
        const info = page.imageinfo?.[0];
        console.log(`   ${i + 1}. ${page.title.replace('File:', '')}`);
        if (info) {
          console.log(`      Size: ${info.width}x${info.height}`);
          console.log(`      License: ${info.extmetadata?.LicenseShortName?.value || 'Unknown'}`);
          console.log(`      URL: ${info.url.substring(0, 60)}...`);
        }
      });
    } else {
      console.log('   ⚠️  No images found in this category');
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${(error as Error).message}`);
  }
  
  // Test 4: Test image download (small test image)
  console.log('\n4. Testing image download...');
  try {
    // Use a known small test image from Wikimedia Commons
    const testImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Wikipedia-logo.png/135px-Wikipedia-logo.png';
    
    const response = await fetch(testImageUrl, {
      headers: { 'User-Agent': USER_AGENT }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    console.log(`   ✅ Image download successful (${buffer.byteLength} bytes)`);
  } catch (error) {
    console.log(`   ❌ Failed: ${(error as Error).message}`);
  }
  
  console.log('\n✅ API tests completed!');
  console.log('\n📋 Recommendations:');
  console.log('   1. The API appears to be working correctly');
  console.log('   2. Implement rate limiting (1-2 seconds between requests)');
  console.log('   3. Handle API errors gracefully');
  console.log('   4. Validate licenses carefully');
  console.log('   5. Respect robots.txt and terms of service');
}

// Run the test
testWikimediaApi().catch(console.error);