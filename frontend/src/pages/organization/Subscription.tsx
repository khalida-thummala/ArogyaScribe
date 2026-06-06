import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { CreditCard, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function OrganizationSubscription() {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      const data = await adminApi.getOrganizationSubscription()
      setSubscription(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CreditCard size={20} color="#7c3aed" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Subscription Plan</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>Manage your organization's plan and billing</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600, padding: 32 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="skeleton" style={{ height: 24, width: '40%', borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 60, width: '100%', borderRadius: 8 }} />
            <div className="skeleton" style={{ height: 60, width: '100%', borderRadius: 8 }} />
          </div>
        ) : !subscription ? (
          <div className="empty-state">
            <h3>No subscription data found</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 18, color: 'var(--text-1)' }}>Current Plan</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
                    background: 'var(--blue-light)', color: 'var(--blue)' 
                  }}>
                    {subscription.plan || 'Standard'}
                  </span>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                    background: subscription.billing_status === 'active' ? '#ecfdf5' : '#f3f4f6', 
                    color: subscription.billing_status === 'active' ? '#059669' : '#6b7280' 
                  }}>
                    {subscription.billing_status || 'Active'}
                  </span>
                </div>
              </div>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={24} color="#3b82f6" />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Building2 size={18} color="var(--text-3)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Organization</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)' }}>{subscription.name}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldCheck size={18} color="var(--text-3)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Max Users Supported</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)' }}>{subscription.max_users} users allowed</div>
                </div>
              </div>
            </div>
            
            {/* Upgrade Request Section */}
            {subscription.plan !== 'premium' && subscription.plan !== 'enterprise' && (
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 16, color: 'var(--text-1)', marginBottom: 8 }}>Need more capacity?</h3>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Request an upgrade to the Premium plan for unlimited doctors and advanced features.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="text" 
                    id="upgrade-message" 
                    placeholder="Why do you need an upgrade? (optional)" 
                    className="input-field" 
                    style={{ flex: 1 }} 
                  />
                  <button 
                    className="btn btn-primary"
                    onClick={async () => {
                      const msg = (document.getElementById('upgrade-message') as HTMLInputElement).value;
                      try {
                        const userStr = localStorage.getItem('auth-storage');
                        const user = userStr ? JSON.parse(userStr).state?.user : null;
                        const orgId = user ? (user.organization_id || user.org_id) : '';
                        await adminApi.createUpgradeRequest({
                          organization_id: orgId,
                          current_plan: subscription.plan || 'basic',
                          requested_plan: 'premium',
                          message: msg
                        });
                        alert('Upgrade request submitted successfully to Super Admin.');
                        (document.getElementById('upgrade-message') as HTMLInputElement).value = '';
                      } catch (e: any) {
                        alert(e.response?.data?.detail || 'Failed to submit upgrade request');
                      }
                    }}
                  >
                    Request Premium Upgrade
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}