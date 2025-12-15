"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Image as ImageIcon, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import ClubHeader from "@/components/clubs/ClubHeader";
import ClubTabs from "@/components/clubs/ClubTabs";
import ImageUploader from "@/components/clubs/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ClubDetail {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  join_policy: string;
  leader_id: string;
  member_count: number;
  tags: string[];
  created_at: string;
  leader?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  isMember: boolean;
  isLeader: boolean;
  memberRole: string | null;
  memberSince: string | null;
  hasPendingRequest: boolean;
  pendingRequestId: string | null;
  pendingRequestsCount: number;
  recentMembers: unknown[];
  recentPostsCount: number;
}

interface GalleryPost {
  id: string;
  title: string;
  image_urls: string[];
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export default function ClubGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [posts, setPosts] = useState<GalleryPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allImages, setAllImages] = useState<{ url: string; postTitle: string }[]>([]);

  useEffect(() => {
    fetchClubAndGallery();
  }, [resolvedParams.id]);

  const fetchClubAndGallery = async () => {
    try {
      setIsLoading(true);

      // Fetch club detail
      const clubResponse = await fetch(`/api/clubs/${resolvedParams.id}`);
      const clubResult = await clubResponse.json();

      if (!clubResult.success) {
        toast({
          title: "오류",
          description: clubResult.error || "동호회를 불러올 수 없습니다.",
          variant: "destructive",
        });
        router.push("/clubs");
        return;
      }

      setClub(clubResult.data);

      // Only fetch gallery if member
      if (clubResult.data.isMember) {
        await fetchGalleryPosts();
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "오류",
        description: "데이터를 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGalleryPosts = async () => {
    try {
      const response = await fetch(
        `/api/clubs/${resolvedParams.id}/posts?type=gallery&limit=100`
      );
      const result = await response.json();

      if (result.success) {
        setPosts(result.data.posts);

        // Flatten all images for lightbox
        const images: { url: string; postTitle: string }[] = [];
        result.data.posts.forEach((post: GalleryPost) => {
          post.image_urls?.forEach((url) => {
            images.push({ url, postTitle: post.title });
          });
        });
        setAllImages(images);
      }
    } catch (error) {
      console.error("Gallery fetch error:", error);
    }
  };

  const handleUploadComplete = async (urls: string[]) => {
    // Create a gallery post with uploaded images
    try {
      const response = await fetch(`/api/clubs/${resolvedParams.id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "gallery",
          title: `사진 ${urls.length}장`,
          content: "",
          imageUrls: urls,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "성공",
          description: "이미지가 업로드되었습니다.",
        });
        setShowUploader(false);
        await fetchGalleryPosts();
      } else {
        toast({
          title: "오류",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Post create error:", error);
      toast({
        title: "오류",
        description: "게시물 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const openLightbox = (imageUrl: string) => {
    const index = allImages.findIndex((img) => img.url === imageUrl);
    if (index !== -1) {
      setCurrentImageIndex(index);
      setLightboxOpen(true);
    }
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentImageIndex((prev) =>
        prev === 0 ? allImages.length - 1 : prev - 1
      );
    } else {
      setCurrentImageIndex((prev) =>
        prev === allImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">동호회를 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (!club.isMember) {
    return (
      <div className="space-y-6">
        <ClubHeader club={club} />
        <ClubTabs
          clubId={club.id}
          isMember={club.isMember}
          isLeader={club.isLeader}
          pendingRequestsCount={club.pendingRequestsCount}
        />
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              동호회 회원만 갤러리를 볼 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClubHeader club={club} />

      <ClubTabs
        clubId={club.id}
        isMember={club.isMember}
        isLeader={club.isLeader}
        pendingRequestsCount={club.pendingRequestsCount}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>갤러리</CardTitle>
          <Button onClick={() => setShowUploader(!showUploader)}>
            <ImageIcon className="h-4 w-4 mr-2" />
            {showUploader ? "닫기" : "사진 업로드"}
          </Button>
        </CardHeader>
        <CardContent>
          {/* Image Uploader */}
          {showUploader && (
            <div className="mb-6 pb-6 border-b">
              <ImageUploader
                clubId={club.id}
                onUploadComplete={handleUploadComplete}
                maxFiles={10}
              />
            </div>
          )}

          {/* Gallery Grid */}
          {allImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allImages.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer group"
                  onClick={() => openLightbox(image.url)}
                >
                  <img
                    src={image.url}
                    alt={image.postTitle}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>아직 업로드된 사진이 없습니다.</p>
              <p className="text-sm">첫 번째 사진을 업로드해보세요!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>이미지 뷰어</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation Buttons */}
            {allImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => navigateLightbox("prev")}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => navigateLightbox("next")}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image */}
            <div className="flex items-center justify-center min-h-[60vh] p-8">
              {allImages[currentImageIndex] && (
                <img
                  src={allImages[currentImageIndex].url}
                  alt={allImages[currentImageIndex].postTitle}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              )}
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
