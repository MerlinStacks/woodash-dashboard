
import { SalesAnalytics } from '../src/services/analytics/sales';
import { BehaviourAnalytics } from '../src/services/analytics/behaviour';
import { AcquisitionAnalytics } from '../src/services/analytics/acquisition';
import { CustomerAnalytics } from '../src/services/analytics/customer';

async function verify() {
    console.log('Verifying Analytics Refactor...');
    const accountId = 'test-account'; // Replace with a valid ID if needed for real data, but we just want to check execution flow (no crash)

    try {
        console.log('1. Testing SalesAnalytics.getTotalSales...');
        // mocked or real execution, just checking if function exists and runs
        await SalesAnalytics.getTotalSales(accountId);
        console.log('   ✅ SalesAnalytics.getTotalSales called successfully.');
    } catch (e: any) {
        console.error('   ❌ SalesAnalytics.getTotalSales failed:', e.message);
    }

    try {
        console.log('2. Testing BehaviourAnalytics.getBehaviourPages...');
        await BehaviourAnalytics.getBehaviourPages(accountId);
        console.log('   ✅ BehaviourAnalytics.getBehaviourPages called successfully.');
    } catch (e: any) {
        console.error('   ❌ BehaviourAnalytics.getBehaviourPages failed:', e.message);
    }

    try {
        console.log('3. Testing AcquisitionAnalytics.getAcquisitionChannels...');
        await AcquisitionAnalytics.getAcquisitionChannels(accountId);
        console.log('   ✅ AcquisitionAnalytics.getAcquisitionChannels called successfully.');
    } catch (e: any) {
        console.error('   ❌ AcquisitionAnalytics.getAcquisitionChannels failed:', e.message);
    }

    try {
        console.log('4. Testing CustomerAnalytics.getCustomerGrowth...');
        await CustomerAnalytics.getCustomerGrowth(accountId);
        console.log('   ✅ CustomerAnalytics.getCustomerGrowth called successfully.');
    } catch (e: any) {
        console.error('   ❌ CustomerAnalytics.getCustomerGrowth failed:', e.message);
    }

    console.log('Verification Complete.');
}

verify();
