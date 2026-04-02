'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge, Button } from '@/components/ui/badge';
import {
  MapPin,
  Navigation,
  Briefcase,
  DollarSign,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AdminAgentView } from '@/lib/types/admin';
import { getAdminAgents } from '@/lib/admin/actions';
import { useAdminAgentUpdates } from '@/lib/admin/hooks';

export default function AdminAgentMap() {
  const [agents, setAgents] = useState<AdminAgentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);

  // Fetch agents
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const result = await getAdminAgents();
      if (result.success) {
        setAgents(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch agents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time agent location updates
  useAdminAgentUpdates((agentId, location) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId && agent.current_session
          ? {
              ...agent,
              current_session: {
                ...agent.current_session,
                gps_lat: location.lat,
                gps_lng: location.lng,
              },
            }
          : agent
      )
    );
  });

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const onDutyAgents = agents.filter((a) => a.status === 'ON_DUTY');
  const offDutyAgents = agents.filter((a) => a.status === 'OFF_DUTY');

  if (loading)
    return (
      <Card className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-slate-600">Loading agents...</p>
      </Card>
    );

  if (error)
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-red-800 text-sm">{error}</p>
      </Card>
    );

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Agents</p>
              <p className="text-2xl font-bold text-slate-900">{agents.length}</p>
            </div>
            <Briefcase className="w-8 h-8 text-blue-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">On Duty</p>
              <p className="text-2xl font-bold text-green-600">{onDutyAgents.length}</p>
            </div>
            <Navigation className="w-8 h-8 text-green-600 opacity-20" />
          </div>
        </Card>

        <Card className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Off Duty</p>
              <p className="text-2xl font-bold text-slate-400">{offDutyAgents.length}</p>
            </div>
            <Clock className="w-8 h-8 text-slate-400 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Map Placeholder */}
      <Card className="p-8 bg-gradient-to-b from-blue-50 to-blue-100 border-2 border-dashed border-blue-200 text-center">
        <MapPin className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-50" />
        <p className="text-slate-600 mb-2">Interactive Map View</p>
        <p className="text-sm text-slate-500 mb-4">
          Real-time agent location tracking with Google Maps integration coming soon
        </p>
        <Button size="sm" variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Locations
        </Button>
      </Card>

      {/* On Duty Agents */}
      <div>
        <h3 className="font-semibold text-slate-900 mb-3 text-lg">
          On Duty ({onDutyAgents.length})
        </h3>
        {onDutyAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {onDutyAgents.map((agent) => (
              <Card
                key={agent.id}
                className="p-4 bg-white border-l-4 border-l-green-500 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  setExpandedAgentId(expandedAgentId === agent.id ? null : agent.id)
                }
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{agent.name}</h4>
                      <p className="text-sm text-slate-600">{agent.phone}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">On Duty</Badge>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded">
                    <div className="text-center">
                      <p className="text-xs text-slate-600">Collected</p>
                      <p className="font-bold text-slate-900">
                        {agent.today_stats?.collections_count || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-600">Earnings</p>
                      <p className="font-bold text-green-600">
                        ৳{agent.today_stats?.earnings || 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-600">Location</p>
                      <p className="font-mono text-xs text-slate-600">
                        {agent.current_session?.gps_lat
                          ? `${agent.current_session.gps_lat.toFixed(2)}`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedAgentId === agent.id && (
                    <div className="border-t pt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Pickup Point:</span>
                        <span className="font-medium text-slate-900">{agent.pickup_point}</span>
                      </div>
                      {agent.current_session && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Session Started:</span>
                            <span className="font-mono text-xs">
                              {new Date(agent.current_session.started_at).toLocaleTimeString(
                                'en-US',
                                {
                                  timeZone: 'Asia/Dhaka',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </span>
                          </div>
                          {agent.current_session.gps_lat && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">GPS:</span>
                              <span className="font-mono text-xs">
                                {agent.current_session.gps_lat.toFixed(4)},
                                {agent.current_session.gps_lng.toFixed(4)}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center bg-slate-50">
            <p className="text-slate-600">No agents currently on duty</p>
          </Card>
        )}
      </div>

      {/* Off Duty Agents */}
      {offDutyAgents.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-900 mb-3 text-lg">
            Off Duty ({offDutyAgents.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offDutyAgents.map((agent) => (
              <Card key={agent.id} className="p-4 bg-slate-50 border-l-4 border-l-slate-300">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{agent.name}</h4>
                    <p className="text-sm text-slate-600">{agent.phone}</p>
                    <p className="text-xs text-slate-500 mt-1">{agent.pickup_point}</p>
                  </div>
                  <Badge className="bg-slate-100 text-slate-800">Off Duty</Badge>
                </div>
                <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Today Collected</p>
                    <p className="font-bold text-slate-900">
                      {agent.today_stats?.collections_count || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-600">Today Earnings</p>
                    <p className="font-bold text-green-600">
                      ৳{agent.today_stats?.earnings || 0}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
