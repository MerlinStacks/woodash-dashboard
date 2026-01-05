import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export interface SeoTest {
    test: string;
    passed: boolean;
    message: string;
}

interface SeoAnalysisPanelProps {
    score: number;
    tests: SeoTest[];
    focusKeyword?: string;
    onUpdateKeyword?: (keyword: string) => void; // Optional if we allow editing here
}

export function SeoAnalysisPanel({ score, tests, focusKeyword }: SeoAnalysisPanelProps) {
    // Dynamic override for "Focus Keyword Set" check
    const processedTests = tests.map(t => {
        if (t.test === 'Focus Keyword Set') {
            return {
                ...t,
                passed: !!focusKeyword && focusKeyword.length > 0,
                message: (!!focusKeyword && focusKeyword.length > 0) ? 'Focus keyword is set' : 'No focus keyword set for this product'
            };
        }
        return t;
    });

    // If "Focus Keyword Set" test is missing (e.g. fresh product), add it
    const hasFocusTest = processedTests.some(t => t.test === 'Focus Keyword Set');
    if (!hasFocusTest && tests.length > 0) {
        processedTests.unshift({
            test: 'Focus Keyword Set',
            passed: !!focusKeyword && focusKeyword.length > 0,
            message: (!!focusKeyword && focusKeyword.length > 0) ? 'Focus keyword is set' : 'No focus keyword set for this product'
        });
    }

    const passedTests = processedTests.filter(t => t.passed);
    const failedTests = processedTests.filter(t => !t.passed);

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">SEO Analysis</h3>
                <div className="text-sm text-gray-500">
                    Focus Keyword: <span className="font-mono font-medium text-gray-900">{focusKeyword || 'Not Set'}</span>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Score Summary */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-gray-100">
                        <span className={`text-xl font-bold ${score > 70 ? 'text-green-600' : score > 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {score}
                        </span>
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{score > 70 ? 'Great job!' : 'Needs Improvement'}</p>
                        <p className="text-sm text-gray-500">{passedTests.length} passed, {failedTests.length} to fix</p>
                    </div>
                </div>

                {/* Analysis List */}
                <div className="space-y-3">
                    {/* Failed Tests First */}
                    {failedTests.map((t, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 text-red-800 text-sm">
                            <XCircle className="shrink-0 mt-0.5" size={16} />
                            <div>
                                <span className="font-medium block">{t.test}</span>
                                <span className="opacity-90">{t.message}</span>
                            </div>
                        </div>
                    ))}

                    {/* Passed Tests */}
                    {passedTests.map((t, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
                            <CheckCircle2 className="shrink-0 mt-0.5" size={16} />
                            <div>
                                <span className="font-medium block">{t.test}</span>
                                <span className="opacity-90">Passed</span>
                            </div>
                        </div>
                    ))}

                    {tests.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            Run a sync to generate analysis.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
