import { NextResponse } from 'next/server';
import PinataSDK from '@pinata/sdk';

export async function GET() {
  try {
    // Test 1: Check if PINATA_JWT exists
    const rawJwt = process.env.PINATA_JWT || '';
    const jwt = rawJwt.trim().replace(/[\r\n]/g, '');

    if (!jwt || jwt === 'YOUR_PINATA_JWT_KEY') {
      return NextResponse.json({
        success: false,
        error: 'PINATA_JWT not configured in Vercel environment variables',
        step: 'env_check',
        debug: {
          rawLength: rawJwt.length,
          trimmedLength: jwt.length,
          isEmpty: jwt.length === 0,
        }
      }, { status: 500 });
    }

    // Test 2: Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJWTKey: jwt,
    });

    // Test 3: Test authentication
    try {
      await pinata.testAuthentication();
    } catch (authError: any) {
      // Auth failed — try direct API call to get more detail
      let directTestResult = null;
      try {
        const directRes = await fetch('https://api.pinata.cloud/data/testAuthentication', {
          headers: { 'Authorization': `Bearer ${jwt}` }
        });
        directTestResult = {
          status: directRes.status,
          statusText: directRes.statusText,
          body: await directRes.text()
        };
      } catch (e: any) {
        directTestResult = { error: e.message };
      }

      return NextResponse.json({
        success: false,
        error: 'Pinata authentication failed',
        step: 'auth_test',
        debug: {
          sdkError: authError.message,
          jwtLength: jwt.length,
          jwtPrefix: jwt.substring(0, 10) + '...',
          jwtSuffix: '...' + jwt.substring(jwt.length - 10),
          hasNewlines: rawJwt !== jwt,
          directApiTest: directTestResult
        }
      }, { status: 500 });
    }

    // Test 4: Upload a small test JSON to IPFS
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Sovereign OS Pinata Test',
    };

    const result = await pinata.pinJSONToIPFS(testData, {
      pinataMetadata: {
        name: `test-backup-${Date.now()}`
      }
    });

    const ipfsCid = result.IpfsHash;
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;

    return NextResponse.json({
      success: true,
      message: 'Pinata is working correctly!',
      tests: {
        env_configured: true,
        auth_successful: true,
        upload_successful: true,
        ipfs_cid: ipfsCid,
        gateway_url: gatewayUrl,
        pinata_size: result.PinSize,
        timestamp: result.Timestamp
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Pinata test failed',
      details: error.message,
    }, { status: 500 });
  }
}
