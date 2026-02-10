import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import Papa from 'papaparse';
import { Upload, Search, Filter, Trash2, Mail, ExternalLink, CheckSquare, Square } from 'lucide-react';

export function Leads() {
  const leads = useQuery(api.leads.list, {});
  const uploadLeads = useMutation(api.leads.upload);
  const generateEmails = useAction(api.http.triggerEmailGeneration);
  const deleteLead = useMutation(api.leads.remove);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedService, setSelectedService] = useState<'ai' | 'web-design'>('ai');
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const parsedLeads = results.data.map((row: any) => ({
            email: row.email || row.personal_email,
            companyName: row.company_name,
            firstName: row.first_name || row.full_name?.split(' ')[0],
            lastName: row.last_name || row.full_name?.split(' ').slice(1).join(' '),
            fullName: row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
            website: row.company_website || row.company_domain,
            serviceType: selectedService,
            metadata: {
              linkedin: row.company_linkedin || row.linkedin,
              jobTitle: row.job_title || row.headline,
              industry: row.industry,
              description: row.company_description,
              location: row.company_city || row.city ? `${row.company_city || row.city}, ${row.state || ''}` : undefined,
              companySize: row.company_size,
              technologies: row.company_technologies,
              seniority: row.seniority_level,
              // Store all other fields
              raw: row,
            },
          })).filter(lead => lead.email && lead.companyName);

          const batchId = Date.now().toString();
          const result = await uploadLeads({ leads: parsedLeads, uploadBatchId: batchId });

          alert(`✅ Uploaded ${result.inserted} leads${result.duplicates > 0 ? `, ${result.duplicates} duplicates skipped` : ''}`);
          setShowUploadModal(false);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          alert('❌ Failed to parse CSV file');
        },
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateEmails = async () => {
    if (selectedLeads.size === 0) {
      alert('Please select leads first');
      return;
    }

    try {
      await generateEmails({ leadIds: Array.from(selectedLeads) as any });
      alert(`✅ Email generation started for ${selectedLeads.size} leads`);
      setSelectedLeads(new Set());
    } catch (error) {
      console.error('Generation error:', error);
      alert('❌ Failed to trigger email generation');
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSet = new Set(selectedLeads);
    if (newSet.has(leadId)) {
      newSet.delete(leadId);
    } else {
      newSet.add(leadId);
    }
    setSelectedLeads(newSet);
  };

  const filteredLeads = leads?.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      new: 'badge-new',
      'email-generated': 'badge-generated',
      approved: 'badge-approved',
      sent: 'badge-sent',
    };
    return `badge ${badges[status] || 'badge-new'}`;
  };

  if (!leads) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Leads</h1>
          <p className="text-text-secondary">{leads.length} total leads</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload Leads
        </button>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by company or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-48"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="email-generated">Email Generated</option>
          <option value="approved">Approved</option>
          <option value="sent">Sent</option>
        </select>

        {selectedLeads.size > 0 && (
          <button
            onClick={handleGenerateEmails}
            className="btn-primary flex items-center gap-2"
          >
            <Mail className="w-5 h-5" />
            Generate Emails ({selectedLeads.size})
          </button>
        )}
      </div>

      {/* Leads table */}
      <div className="glass-card overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
            <h3 className="text-xl font-semibold mb-2">No leads yet</h3>
            <p className="text-text-secondary mb-4">Upload your first batch to get started</p>
            <button onClick={() => setShowUploadModal(true)} className="btn-primary">
              Upload Leads
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-white/10">
              <tr className="text-left">
                <th className="p-4 w-12">
                  {selectedLeads.size > 0 ? (
                    <CheckSquare className="w-5 h-5 text-accent-blue" />
                  ) : (
                    <Square className="w-5 h-5 text-text-tertiary" />
                  )}
                </th>
                <th className="p-4">Name</th>
                <th className="p-4">Company</th>
                <th className="p-4">Email</th>
                <th className="p-4">Service</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <motion.tr
                  key={lead._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-white/5 hover:bg-bg-tertiary/30 transition-colors"
                >
                  <td className="p-4">
                    <button onClick={() => toggleLeadSelection(lead._id)}>
                      {selectedLeads.has(lead._id) ? (
                        <CheckSquare className="w-5 h-5 text-accent-blue" />
                      ) : (
                        <Square className="w-5 h-5 text-text-tertiary hover:text-text-secondary" />
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-sm font-medium">
                        {lead.firstName?.[0] || lead.email[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{lead.fullName || lead.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span>{lead.companyName}</span>
                      {lead.website && (
                        <a
                          href={`https://${lead.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-blue hover:text-accent-cyan"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-text-secondary font-mono text-sm">{lead.email}</td>
                  <td className="p-4">
                    <span className={lead.serviceType === 'ai' ? 'badge-ai badge' : 'badge-web-design badge'}>
                      {lead.serviceType === 'ai' ? 'AI' : 'Web Design'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={getStatusBadge(lead.status)}>
                      {lead.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => deleteLead({ id: lead._id })}
                      className="text-text-tertiary hover:text-accent-red transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold mb-4">Upload Leads</h2>
            <p className="text-text-secondary mb-6">
              Upload your Apify CSV export. All fields will be automatically mapped.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedService('ai')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedService === 'ai'
                        ? 'border-accent-blue bg-accent-blue/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium">AI Services</div>
                    <div className="text-xs text-text-secondary">AI consulting & automation</div>
                  </button>
                  <button
                    onClick={() => setSelectedService('web-design')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedService === 'web-design'
                        ? 'border-accent-cyan bg-accent-cyan/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium">Web Design</div>
                    <div className="text-xs text-text-secondary">Website development</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="input-field cursor-pointer"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>

            {uploading && (
              <div className="mt-4 text-center text-text-secondary">
                Uploading and parsing CSV...
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
