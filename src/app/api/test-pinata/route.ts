import { NextResponse } from 'next/server';
import PinataSDK from '@pinata/sdk';

export async function GET() {
  try {
    // Test 1: Check if PINATA_JWT exists
    const jwt = (process.env.PINATA_JWT || '').trim().replace(/[\r\n]/g, '');
    if (!jwt || jwt === 'YOUR_PINATA_JWT_KEY') {
      return NextResponse.json({
        success: false,
        error: 'PINATA_JWT not configured in Vercel environment variables',
        step: 'env_check'
      }, { status: 500 });
    }

    // Test 2: Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJWTKey: jwt,
    });

    // Test 3: Test authentication by listing pins (lightweight test)
    try {
      await pinata.testAuthentication();
    } catch (authError: any) {
      return NextResponse.json({
        success: false,
        error: 'Pinata authentication failed',
        details: authError.message,
        step: 'auth_test'
      }, { status: 500 });
    }

    // Test 4: Upload a small test JSON to IPFS
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Sovereign OS Pinata Test',
      encrypted: Buffer.from('test-encrypted-data').toString('base64')
    };

    const result = await pinata.pinJSONToIPFS(testData, {
      pinataMetadata: {
        name: `test-backup-${Date.now()}`
      }
    });

    // Test 5: Verify the upload
    const ipfsCid = result.IpfsHash;
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;

    return NextResponse.json({
      success: true,
      message: 'Pinata is working correctly on Vercel!',
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
      stack: error.stack?.split('\n').slice(0, 3)
    }, { status: 500 });
  }
}
