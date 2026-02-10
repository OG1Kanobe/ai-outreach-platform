import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { Check, X, RefreshCw, Send, ExternalLink } from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';

export function EmailReview() {
  const pendingEmails = useQuery(api.emails.list, { status: 'pending-review' });
  const approvedEmails = useQuery(api.emails.list, { status: 'approved' });
  const updateEmail = useMutation(api.emails.update);
  const approveEmail = useMutation(api.emails.approve);
  const rejectEmail = useMutation(api.emails.reject);
  const bulkApprove = useMutation(api.emails.bulkApprove);
  const sendEmails = useAction(api.http.triggerEmailSending);

  const [selectedEmailId, setSelectedEmailId] = useState<Id<'emails'> | null>(null);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBody, setEditedBody] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  const emails = activeTab === 'pending' ? pendingEmails : approvedEmails;
  const selectedEmail = emails?.find(e => e._id === selectedEmailId);

  const handleSelectEmail = (emailId: Id<'emails'>) => {
    const email = emails?.find(e => e._id === emailId);
    if (email) {
      setSelectedEmailId(emailId);
      setEditedSubject(email.subject);
      setEditedBody(email.body);
    }
  };

  const handleApprove = async () => {
    if (!selectedEmailId) return;

    try {
      // Save edits if any
      if (editedSubject !== selectedEmail?.subject || editedBody !== selectedEmail?.body) {
        await updateEmail({
          id: selectedEmailId,
          subject: editedSubject,
          body: editedBody,
        });
      }

      await approveEmail({ id: selectedEmailId });
      setSelectedEmailId(null);
    } catch (error) {
      console.error('Approve error:', error);
      alert('❌ Failed to approve email');
    }
  };

  const handleReject = async () => {
    if (!selectedEmailId) return;

    try {
      await rejectEmail({ id: selectedEmailId });
      setSelectedEmailId(null);
    } catch (error) {
      console.error('Reject error:', error);
    }
  };

  const handleSendApproved = async () => {
    if (!approvedEmails || approvedEmails.length === 0) {
      alert('No approved emails to send');
      return;
    }

    try {
      await sendEmails({ emailIds: approvedEmails.map(e => e._id) as any });
      alert(`✅ Sending ${approvedEmails.length} emails`);
    } catch (error) {
      console.error('Send error:', error);
      alert('❌ Failed to send emails');
    }
  };

  const handleApproveAll = async () => {
    if (!pendingEmails || pendingEmails.length === 0) return;

    if (!confirm(`Approve all ${pendingEmails.length} pending emails?`)) return;

    try {
      await bulkApprove({ ids: pendingEmails.map(e => e._id) as any });
    } catch (error) {
      console.error('Bulk approve error:', error);
    }
  };

  if (!emails) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Email Review</h1>
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-accent-blue/20 text-accent-blue'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Pending Review ({pendingEmails?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'approved'
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Approved ({approvedEmails?.length || 0})
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            {activeTab === 'pending' && pendingEmails && pendingEmails.length > 0 && (
              <button onClick={handleApproveAll} className="btn-secondary">
                Approve All
              </button>
            )}
            {activeTab === 'approved' && approvedEmails && approvedEmails.length > 0 && (
              <button onClick={handleSendApproved} className="btn-primary flex items-center gap-2">
                <Send className="w-5 h-5" />
                Send All ({approvedEmails.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Email list */}
        <div className="w-96 border-r border-white/10 overflow-y-auto">
          {emails.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              {activeTab === 'pending' 
                ? 'No pending emails. Generate some from the Leads page!'
                : 'No approved emails yet. Review and approve pending emails first.'
              }
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {emails.map((email) => (
                <motion.button
                  key={email._id}
                  onClick={() => handleSelectEmail(email._id)}
                  whileHover={{ x: 4 }}
                  className={`
                    w-full text-left p-4 rounded-lg border transition-all
                    ${selectedEmailId === email._id
                      ? 'bg-accent-blue/10 border-accent-blue/30'
                      : 'bg-bg-tertiary/30 border-white/10 hover:border-white/20'
                    }
                  `}
                >
                  <div className="font-medium mb-1 truncate">{email.lead?.companyName}</div>
                  <div className="text-sm text-text-secondary mb-2 truncate">
                    {email.lead?.fullName || email.lead?.email}
                  </div>
                  <div className="text-xs text-text-tertiary truncate">{email.subject}</div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Email preview/editor */}
        <div className="flex-1 overflow-y-auto p-8">
          {!selectedEmail ? (
            <div className="flex items-center justify-center h-full text-text-secondary">
              Select an email to review
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* Lead info */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedEmail.lead?.companyName}</h2>
                    <div className="text-text-secondary space-y-1">
                      <div>{selectedEmail.lead?.fullName}</div>
                      <div>{selectedEmail.lead?.metadata?.jobTitle}</div>
                      <div className="text-sm">{selectedEmail.lead?.email}</div>
                    </div>
                  </div>
                  {selectedEmail.lead?.website && (
                    <a
                      href={`https://${selectedEmail.lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-accent-blue hover:text-accent-cyan"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>

              {/* Email editor */}
              <div className="glass-card p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    className="input-field font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Body</label>
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="input-field min-h-[300px] font-mono text-sm leading-relaxed"
                  />
                </div>

                {/* Actions */}
                {activeTab === 'pending' && (
                  <div className="flex gap-3">
                    <button onClick={handleApprove} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Approve
                    </button>
                    <button onClick={handleReject} className="btn-secondary flex items-center gap-2">
                      <X className="w-5 h-5" />
                      Reject
                    </button>
                    <button className="btn-secondary">
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
