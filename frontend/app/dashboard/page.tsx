'use client';

import { useEffect, useState } from 'react';
import { Calendar, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Brief {
  id: string;
  company_name: string;
  contact_name: string;
  created_at: string;
  confidence_score: number;
  research_jobs: {
    meeting_time: string;
    status: string;
  };
}

export default function Dashboard() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBriefs();
  }, []);

  const fetchBriefs = async () => {
    try {
      // TODO: Replace with actual user ID from auth
      const userId = 'demo-user-id';

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/briefs?userId=${userId}`
      );

      const data = await response.json();

      if (data.success) {
        setBriefs(data.briefs);
      }
    } catch (error) {
      console.error('Failed to fetch briefs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Geodo Dashboard</h1>
            <div className="flex items-center space-x-4">
              <a
                href="/settings"
                className="text-gray-600 hover:text-gray-900"
              >
                Settings
              </a>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                Sync Calendar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Briefs</p>
                <p className="text-3xl font-bold text-gray-900">{briefs.length}</p>
              </div>
              <FileText className="h-10 w-10 text-primary-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-3xl font-bold text-gray-900">
                  {briefs.filter(b => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(b.created_at) > weekAgo;
                  }).length}
                </p>
              </div>
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {briefs.filter(b => b.research_jobs.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processing</p>
                <p className="text-3xl font-bold text-gray-900">
                  {briefs.filter(b => b.research_jobs.status === 'processing').length}
                </p>
              </div>
              <Clock className="h-10 w-10 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Briefs List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Research Briefs</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading briefs...</p>
            </div>
          ) : briefs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No briefs yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Connect your calendar to start receiving automatic research briefs
              </p>
              <a
                href="/settings"
                className="inline-block mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                Connect Calendar
              </a>
            </div>
          ) : (
            <div className="divide-y">
              {briefs.map((brief) => (
                <a
                  key={brief.id}
                  href={`/brief/${brief.id}`}
                  className="block p-6 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(brief.research_jobs.status)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {brief.company_name}
                        </h3>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-600">
                          {brief.contact_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(brief.research_jobs.meeting_time).toLocaleDateString()}
                          {' at '}
                          {new Date(brief.research_jobs.meeting_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>
                          Status: {getStatusText(brief.research_jobs.status)}
                        </span>
                        {brief.confidence_score && (
                          <span>
                            Confidence: {(brief.confidence_score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="text-primary-600 hover:text-primary-700">
                        View Brief →
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
