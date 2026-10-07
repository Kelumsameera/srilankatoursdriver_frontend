"use client";

import { Suspense, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CrmList } from "@/components/admin/CrmList";
import { Button, Label, LoadingBlock, Modal, Select } from "@/components/admin/ui";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { formatDate } from "@/lib/utils";

interface Msg {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: string;
  createdAt: string;
}

function MessageModal({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { can } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["msg", id], queryFn: () => api.get<Msg>(`/admin/contact-messages/${id}`) });
  const m = data?.data;
  const setStatus = async (status: string) => {
    try {
      await api.patch(`/admin/contact-messages/${id}`, { status });
      await qc.invalidateQueries({ queryKey: ["crm"] });
      await qc.invalidateQueries({ queryKey: ["msg", id] });
      toast.success("Updated");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };
  return (
    <Modal
      open
      onClose={() => {
        void qc.invalidateQueries({ queryKey: ["crm"] });
        onClose();
      }}
      title={m?.subject || "Message"}
      footer={
        <>
          {can("contacts:delete") && (
            <Button
              variant="danger"
              className="me-auto"
              onClick={async () => {
                await api.del(`/admin/contact-messages/${id}`).catch((e) => toast.error(errorMessage(e)));
                await qc.invalidateQueries({ queryKey: ["crm"] });
                onClose();
              }}
            >
              Delete
            </Button>
          )}
          {m && (
            <a className="rounded-lg bg-forest-800 px-4 py-2 text-sm font-medium text-white" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? ""}`)}`}>
              Reply by email
            </a>
          )}
        </>
      }
    >
      {isLoading || !m ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-4 text-sm">
          <p>
            <strong>{m.name}</strong> · <a className="text-forest-700" href={`mailto:${m.email}`}>{m.email}</a> {m.phone && <>· {m.phone}</>}
          </p>
          <p className="text-xs text-slate-500">{formatDate(m.createdAt, "en", { dateStyle: "full", timeStyle: "short" })}</p>
          <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4">{m.message}</p>
          {can("contacts:update") && (
            <div>
              <Label htmlFor="msg-status">Status</Label>
              <Select id="msg-status" value={m.status} onChange={(e) => setStatus(e.target.value)}>
                {["new", "read", "replied", "archived"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function MessagesPage() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <Suspense>
      <CrmList
        title="Contact Messages"
        description="Messages from the contact form."
        endpoint="/admin/contact-messages"
        detailBase="/admin/messages"
        permission="contacts"
        exportName="contact-messages"
        statuses={["new", "read", "replied", "archived"]}
        onRowClick={(r) => setOpen(r._id)}
        columns={[
          { label: "From", render: (r) => `${r.name} <${r.email}>` },
          { label: "Subject", render: (r) => String(r.subject || "—") },
          { label: "Message", render: (r) => <span className="line-clamp-1 max-w-md text-slate-500">{String(r.message)}</span> },
        ]}
      />
      {open && <MessageModal id={open} onClose={() => setOpen(null)} />}
    </Suspense>
  );
}
