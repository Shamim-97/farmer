'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge, Button, Input } from '@/components/ui/badge';
import {
  ImageIcon,
  MapPin,
  Clock,
  User,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAdminCollectionUpdates } from '@/lib/admin/hooks';

interface CollectionProof {
  id: string;
  order_id: string;
  agent_id: string;
  agent_name: string;
  photo_url: string;
  gps_lat: number;
  gps_lng: number;
  timestamp: string;
}

export default function AdminCollectionGallery() {
  const [proofs, setProofs] = useState<CollectionProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProof, setSelectedProof] = useState<CollectionProof | null>(null);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  // Fetch collection proofs
  const fetchProofs = async (date: string) => {
    setLoading(true);
    try {
      const client = createBrowserClient();

      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;

      const { data, error: queryError } = await client
        .from('collection_proofs')
        .select(
          `
          id,
          order_id,
          agent_id,
          photo_url,
          gps_lat,
          gps_lng,
          timestamp,
          agent:agent_id (full_name)
        `
        )
        .gte('timestamp', startOfDay)
        .lte('timestamp', endOfDay)
        .order('timestamp', { ascending: false });

      if (queryError) throw queryError;

      const formattedProofs = (data || []).map((p: any) => ({
        id: p.id,
        order_id: p.order_id,
        agent_id: p.agent_id,
        agent_name: p.agent?.full_name || 'Unknown',
        photo_url: p.photo_url,
        gps_lat: p.gps_lat,
        gps_lng: p.gps_lng,
        timestamp: p.timestamp,
      }));

      setProofs(formattedProofs);
      setError(null);
    } catch (err) {
      setError('Failed to fetch collection proofs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to new collection proofs
  useAdminCollectionUpdates((orderId, proofUrl) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === today) {
      // New proof added, could refetch or add to list
      fetchProofs(dateFilter);
    }
  });

  useEffect(() => {
    fetchProofs(dateFilter);
  }, [dateFilter]);

  // Navigate between dates
  const goToPreviousDay = () => {
    const prev = new Date(dateFilter);
    prev.setDate(prev.getDate() - 1);
    setDateFilter(prev.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const next = new Date(dateFilter);
    next.setDate(next.getDate() + 1);
    setDateFilter(next.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setDateFilter(new Date().toISOString().split('T')[0]);
  };

  if (selectedProof) {
    const currentIndex = proofs.findIndex((p) => p.id === selectedProof.id);
    return (
      <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 md:p-8">
        <div className="bg-white rounded-lg w-full max-w-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Collection Proof</h2>
              <p className="text-sm text-slate-600">Order: {selectedProof.order_id}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedProof(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {/* Photo */}
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Photo</p>
              <img
                src={selectedProof.photo_url}
                alt="Collection proof"
                className="w-full rounded-lg border border-slate-200"
              />
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-600">Agent</p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-900">{selectedProof.agent_name}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-600">Collected At</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-900">
                    {new Date(selectedProof.timestamp).toLocaleTimeString('en-US', {
                      timeZone: 'Asia/Dhaka',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <p className="text-xs text-slate-600">GPS Location</p>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-900">
                    {selectedProof.gps_lat.toFixed(4)}, {selectedProof.gps_lng.toFixed(4)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between p-4 border-t bg-slate-50">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const prev = proofs[currentIndex + 1];
                if (prev) setSelectedProof(prev);
              }}
              disabled={currentIndex === proofs.length - 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm text-slate-600">
              {currentIndex + 1} of {proofs.length}
            </span>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const next = proofs[currentIndex - 1];
                if (next) setSelectedProof(next);
              }}
              disabled={currentIndex === 0}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Select Date:</label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={goToPreviousDay}>
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button size="sm" variant="outline" onClick={goToToday}>
              Today
            </Button>
            <Button size="sm" variant="outline" onClick={goToNextDay}>
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-sm text-slate-600">
            {proofs.length} proofs on {new Date(dateFilter).toLocaleDateString()}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading collection proofs...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-800 text-sm">{error}</p>
        </Card>
      )}

      {/* Gallery Grid */}
      {!loading && !error && proofs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proofs.map((proof) => (
            <Card
              key={proof.id}
              className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
              onClick={() => setSelectedProof(proof)}
            >
              {/* Image */}
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                <img
                  src={proof.photo_url}
                  alt={`Order ${proof.order_id}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-slate-500">Order ID</p>
                    <p className="font-semibold text-slate-900">{proof.order_id}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-xs">Collected</Badge>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1 text-slate-700">
                    <User className="w-3 h-3 text-slate-500" />
                    <span>{proof.agent_name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>
                      {new Date(proof.timestamp).toLocaleTimeString('en-US', {
                        timeZone: 'Asia/Dhaka',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <span className="font-mono text-xs">
                      {proof.gps_lat.toFixed(3)}, {proof.gps_lng.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && proofs.length === 0 && (
        <Card className="p-8 text-center">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600">No collection proofs found for this date</p>
          <p className="text-sm text-slate-500 mt-1">Try selecting a different date</p>
        </Card>
      )}
    </div>
  );
}
