import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { Save, Webhook, Mail } from 'lucide-react';

export function Settings() {
  const settings = useQuery(api.settings.list);
  const setSetting = useMutation(api.settings.set);

  const [n8nGenerateUrl, setN8nGenerateUrl] = useState('');
  const [n8nSendUrl, setN8nSendUrl] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      const generateUrl = settings.find(s => s.key === 'n8n_webhook_generate_url');
      const sendUrl = settings.find(s => s.key === 'n8n_webhook_send_url');
      const email = settings.find(s => s.key === 'from_email_address');

      if (generateUrl) setN8nGenerateUrl(generateUrl.value);
      if (sendUrl) setN8nSendUrl(sendUrl.value);
      if (email) setFromEmail(email.value);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setSetting({ key: 'n8n_webhook_generate_url', value: n8nGenerateUrl });
      await setSetting({ key: 'n8n_webhook_send_url', value: n8nSendUrl });
      await setSetting({ key: 'from_email_address', value: fromEmail });
      alert('✅ Settings saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* n8n Integration */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <Webhook className="w-6 h-6 text-accent-blue" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">n8n Integration</h2>
              <p className="text-sm text-text-secondary">Configure webhook URLs for your n8n workflows</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Generation Webhook URL
              </label>
              <input
                type="url"
                value={n8nGenerateUrl}
                onChange={(e) => setN8nGenerateUrl(e.target.value)}
                placeholder="https://your-n8n.app/webhook/generate-emails"
                className="input-field font-mono text-sm"
              />
              <p className="text-xs text-text-tertiary mt-1">
                This webhook receives lead data and triggers email generation
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email Sending Webhook URL
              </label>
              <input
                type="url"
                value={n8nSendUrl}
                onChange={(e) => setN8nSendUrl(e.target.value)}
                placeholder="https://your-n8n.app/webhook/send-emails"
                className="input-field font-mono text-sm"
              />
              <p className="text-xs text-text-tertiary mt-1">
                This webhook receives approved emails and sends them via Gmail/Outlook
              </p>
            </div>
          </div>
        </div>

        {/* Email Configuration */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent-cyan/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Email Configuration</h2>
              <p className="text-sm text-text-secondary">Set your sending email address</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              From Email Address
            </label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="you@agency.com"
              className="input-field"
            />
            <p className="text-xs text-text-tertiary mt-1">
              This email will be used as the sender for all outreach emails
            </p>
          </div>
        </div>

        {/* Convex Webhook Endpoints */}
        <div className="glass-card p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Convex Webhook Endpoints</h2>
            <p className="text-sm text-text-secondary">
              Use these URLs in your n8n workflows to send data back to the platform
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-bg-tertiary rounded-lg">
              <div className="text-xs text-text-tertiary mb-1">Email Generated Callback</div>
              <code className="text-sm text-accent-blue break-all">
                {import.meta.env.VITE_CONVEX_URL?.replace('.cloud', '.site')}/webhook/email-generated
              </code>
            </div>

            <div className="p-4 bg-bg-tertiary rounded-lg">
              <div className="text-xs text-text-tertiary mb-1">Email Sent Callback</div>
              <code className="text-sm text-accent-blue break-all">
                {import.meta.env.VITE_CONVEX_URL?.replace('.cloud', '.site')}/webhook/email-sent
              </code>
            </div>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
