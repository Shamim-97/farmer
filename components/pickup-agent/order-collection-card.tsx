'use client';

import { useRef, useState } from 'react';
import {
  Camera,
  MapPin,
  DollarSign,
  Package,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { AgentOrder } from '@/lib/types/pickup-agent';

interface OrderCollectionCardProps {
  order: AgentOrder;
  onCollected: () => void;
}

export default function OrderCollectionCard({
  order,
  onCollected,
}: OrderCollectionCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [collected, setCollected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFile, setUseFile] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
      setUseFile(false);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied');
      // Fallback to file input
      setUseFile(true);
    }
  };

  const capturePhoto = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob((blob) => {
          setPhoto(blob);
          setShowCamera(false);

          // Stop video stream
          const stream = videoRef.current?.srcObject as MediaStream;
          stream?.getTracks().forEach((track) => track.stop());
        }, 'image/jpeg');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setUseFile(false);
      setError(null);
    }
  };

  const submitCollection = async () => {
    if (!photo) {
      setError('Photo is required');
      return;
    }

    setCollecting(true);
    try {
      // Get GPS location
      const position = await new Promise<GeolocationCoordinates>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => reject(err)
          );
        }
      );

      const formData = new FormData();
      formData.append('order_id', order.id);
      formData.append('gps_lat', position.latitude.toString());
      formData.append('gps_lng', position.longitude.toString());
      formData.append('photo', photo, 'collection-proof.jpg');

      const response = await fetch('/api/collect-order', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to submit');
        return;
      }

      setCollected(true);
      setError(null);

      // Notify parent
      setTimeout(() => {
        onCollected();
      }, 1500);
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to submit order. Check internet connection.');
    } finally {
      setCollecting(false);
    }
  };

  if (collected) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-900">Order Collected!</p>
            <p className="text-xs text-green-700">
              Order #{order.id.slice(0, 8).toUpperCase()} collected successfully
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      {/* Order Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">
            {order.product?.name_en || 'Product'}
          </p>
          <p className="text-xs text-slate-600">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <p className="text-lg font-bold text-slate-900">
          ৳{order.total_amount?.toLocaleString() || 0}
        </p>
      </div>

      {/* Order Details */}
      <div className="space-y-2 border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Quantity</span>
          <span className="font-semibold text-slate-900">{order.quantity_kg} kg</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Customer</span>
          <span className="font-semibold text-slate-900">
            {order.customer?.full_name?.split(' ')[0] || 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Payment</span>
          <span
            className={`font-semibold ${order.payment_status === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}
          >
            {order.payment_status}
          </span>
        </div>
      </div>

      {/* Photo Capture Section */}
      {!photo ? (
        <>
          {/* Error */}
          {error && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Camera Display */}
          {showCamera ? (
            <div className="space-y-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
              />
              <canvas ref={canvasRef} className="hidden" />
              <button
                onClick={capturePhoto}
                className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Capture Photo
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={startCamera}
                className="w-full rounded-lg border-2 border-dashed border-slate-300 py-3 text-center font-semibold text-slate-700 hover:border-slate-400 bg-slate-50 flex items-center justify-center gap-2"
              >
                <Camera className="h-5 w-5" />
                Take Photo
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Upload Photo
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}
        </>
      ) : (
        <>
          {/* Photo Preview */}
          <div>
            <img
              src={URL.createObjectURL(photo)}
              alt="Collection proof"
              className="w-full rounded-lg border border-slate-200"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPhoto(null)}
              className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Retake
            </button>
            <button
              onClick={submitCollection}
              disabled={collecting}
              className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-slate-400 flex items-center justify-center gap-2"
            >
              {collecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                '✓ Collect Order'
              )}
            </button>
          </div>
        </>
      )}

      {/* Info */}
      <p className="text-xs text-slate-600 border-t border-slate-200 pt-2">
        📍 GPS location will be recorded with your photo
      </p>
    </div>
  );
}
