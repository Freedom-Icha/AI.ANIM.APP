import React, { useEffect, useState } from "react";
import { Image, Film, Music, HardDrive, Trash2 } from "lucide-react";
import StatCard from "../components/StatCard";
import adminApi from "../lib/api";

export default function FileManagement() {
  const [data, setData] = useState(null);
  const [unused, setUnused] = useState([]);

  function load() {
    adminApi.get("/files").then(setData);
    adminApi.get("/files/unused").then((d) => setUnused(d.orphanedFiles || []));
  }
  useEffect(load, []);

  async function deleteFile(id) {
    await adminApi.delete(`/files/${id}`);
    load();
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-white mb-1">File Management</h1>
      <p className="text-sm text-gray-500 mb-6">Supabase Storage usage across all buckets.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Image} label="Images Stored" value={data?.totalImagesStored ?? "—"} />
        <StatCard icon={Film} label="Videos Stored" value={data?.totalVideosStored ?? "—"} />
        <StatCard icon={Music} label="Audio Files Stored" value={data?.totalAudioStored ?? "—"} />
        <StatCard icon={HardDrive} label="Total Storage" value={data ? `${data.totalStorageGB} GB` : "—"} />
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-5">
        <div className="text-sm text-white font-medium mb-3">Unused / Orphaned Files ({unused.length})</div>
        <div className="text-xs text-gray-500 mb-3">Files whose parent project was deleted — safe to clean up.</div>
        {unused.length === 0 && <div className="text-xs text-gray-600">Nothing to clean up right now.</div>}
        {unused.map((f) => (
          <div key={f.id} className="flex items-center justify-between text-xs py-2 border-b border-brand-border last:border-0">
            <span className="text-gray-300">{f.bucket}/{f.storage_path}</span>
            <div className="flex items-center gap-3">
              <span className="text-gray-500">{(f.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
              <button onClick={() => deleteFile(f.id)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
