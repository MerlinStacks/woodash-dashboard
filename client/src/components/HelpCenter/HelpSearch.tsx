import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function HelpSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { token } = useAuth();

    useEffect(() => {
        if (query.length > 2) {
            const fetchResults = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/help/search?q=${query}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setResults(Array.isArray(data) ? data : []);
                    setIsOpen(true);
                } catch (e) {
                    console.error(e);
                    setResults([]);
                }
            }, 300);
            return () => clearTimeout(fetchResults);
        } else {
            setResults([]);
            setIsOpen(false);
        }
    }, [query, token]);

    return (
        <div className="relative w-full max-w-2xl mx-auto z-50">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                    type="text"
                    placeholder="Search for help..."
                    className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all shadow-sm hover:shadow-md"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (query.length > 2) setIsOpen(true); }}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                />
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden z-50">
                    {results.map((article: any) => (
                        <div
                            key={article.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors flex flex-col items-start text-left"
                            onMouseDown={() => {
                                navigate(`/help/article/${article.slug}`);
                                setIsOpen(false);
                                setQuery('');
                            }}
                        >
                            <h4 className="text-gray-900 font-medium text-sm mb-1">{article.title}</h4>
                            <p className="text-gray-500 text-xs line-clamp-1 w-full">{article.excerpt || article.content?.substring(0, 100)}</p>
                            <span className="inline-block mt-2 text-[10px] uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-semibold">
                                {article.collection?.title}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
