"use client";

import { MediaLibrary } from "@/components/admin/MediaLibrary";
import { Card, PageHeader } from "@/components/admin/ui";

export default function MediaPage() {
  return (
    <div>
      <PageHeader title="Media Library" description="All images and videos are stored on Cloudinary; MongoDB keeps their metadata. Click an item to edit, replace, copy its URL or delete it." />
      <Card>
        <MediaLibrary />
      </Card>
    </div>
  );
}
