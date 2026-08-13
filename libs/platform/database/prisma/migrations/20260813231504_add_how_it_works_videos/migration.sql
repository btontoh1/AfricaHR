-- CreateTable
CREATE TABLE "how_it_works_videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "video_url" TEXT NOT NULL,
    "category" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "how_it_works_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "how_it_works_videos_sort_order_idx" ON "how_it_works_videos"("sort_order");
