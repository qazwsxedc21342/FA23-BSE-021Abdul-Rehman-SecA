import { AdCard, Spinner, EmptyState, PageHeader } from '../components/UI';
import { useSocket } from '../features/socket/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExplorePage() {
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [sort, setSort] = useState('rank');

  const fetchAds = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await publicAPI.getAds({ search, category, city, sort, page, limit: 12 });
      setAds(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, total: 0, pages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, category, city, sort]);

  useEffect(() => {
    publicAPI.getCategories()
      .then(r => setCategories(r.data.data || []))
      .catch((e) => { console.error(e); setCategories([]); });

    publicAPI.getCities()
      .then(r => setCities(r.data.data || []))
      .catch((e) => { console.error(e); setCities([]); });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchAds(1), 300);
    return () => clearTimeout(t);
  }, [fetchAds]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleAdUpdate = () => {
      console.log('⚡ Real-time ad update received!');
      fetchAds(pagination.page);
    };

    socket.on('ad_updated', handleAdUpdate);

    return () => {
      socket.off('ad_updated', handleAdUpdate);
    };
  }, [socket, fetchAds, pagination.page]);

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }}>
      <div className="section">
        <PageHeader title="Explore Listings" sub={`${pagination.total} active listings`} />

        {/* ── Filters ─────────────────────────────────────────── */}
        <motion.div 
          className="glass"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: 24, borderRadius: 20, marginBottom: 32, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div style={{ flex: 2, minWidth: 200 }}>
            <label className="label">Search Listings</label>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. iPhone 15, Honda Civic..." style={{ background: 'rgba(0,0,0,0.2)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label className="label">Category</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)' }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label className="label">City</label>
            <select className="input" value={city} onChange={e => setCity(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)' }}>
              <option value="">All Cities</option>
              {cities.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label className="label">Sort</label>
            <select className="input" value={sort} onChange={e => setSort(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)' }}>
              <option value="rank">Best Match</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
          {(search || category || city) && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary" style={{ padding: '10px 20px', fontSize: 13, borderRadius: 10 }}
              onClick={() => { setSearch(''); setCategory(''); setCity(''); setSort('rank'); }}>
              Reset Filters
            </motion.button>
          )}
        </motion.div>

        {/* ── Results ─────────────────────────────────────────── */}
        {loading ? (
          <Spinner />
        ) : ads.length === 0 ? (
          <EmptyState icon="🔍" message="No listings found. Try adjusting your filters." />
        ) : (
          <>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Showing {ads.length} of {pagination.total} listings · sorted by {sort}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
              {ads.map((ad, idx) => (
                <motion.div 
                  key={ad.id}
                  initial={{ opacity: 0, scale: 0.9, rotateY: -5 }}
                  whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ delay: (idx % 4) * 0.1 }}
                  viewport={{ once: true }}
                >
                  <AdCard ad={ad} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => fetchAds(p)} style={{
                    background: pagination.page === p ? '#e94560' : '#1e293b',
                    color: pagination.page === p ? '#fff' : '#94a3b8',
                    border: '1px solid #334155', borderRadius: 8,
                    padding: '6px 12px', fontSize: 13, cursor: 'pointer',
                  }}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
