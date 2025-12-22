'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  department: string | null;
  created_at: string;
  has_embedding: boolean;
  embedding_updated_at?: string | null;
}

export default function FaceManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const response = await fetch('/api/face-recognition/embeddings/status', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load face embedding status');
      }

      const data = await response.json();
      setUsers(data.users || []);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFaceImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleDeleteEmbedding(userId: string) {
    if (!confirm('이 얼굴 임베딩을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingUserId(userId);
      setMessage(null);

      const response = await fetch(`/api/face-recognition/embeddings/delete?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete face embedding');
      }

      setMessage({ type: 'success', text: '얼굴 임베딩이 삭제되었습니다.' });
      await loadData();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleUpload() {
    if (!selectedUserId || !faceImage) {
      setMessage({ type: 'error', text: '사용자와 이미지를 선택해주세요' });
      return;
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) {
      setMessage({ type: 'error', text: '선택된 사용자를 찾을 수 없습니다' });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append('face', faceImage);
      formData.append('userId', selectedUserId);
      formData.append('name', selectedUser.name);
      formData.append('email', selectedUser.email);
      if (selectedUser.department) {
        formData.append('org', selectedUser.department);
      }

      const response = await fetch('/api/face-recognition/upload-face', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '얼굴 등록이 완료되었습니다!' });
        setFaceImage(null);
        setPreviewUrl(null);
        setSelectedUserId('');
        await loadData();
      } else {
        throw new Error(data.error || '얼굴 등록 실패');
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploading(false);
    }
  }

  function hasEmbedding(userId: string): boolean {
    return users.some(user => user.id === userId && user.has_embedding);
  }

  const registeredCount = users.filter(user => user.has_embedding).length;
  const unregisteredCount = users.length - registeredCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/face-recognition">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">얼굴 등록 관리</h1>
          <p className="text-sm text-muted-foreground">사용자의 얼굴 이미지를 등록하고 관리합니다</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="register">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register">얼굴 등록</TabsTrigger>
          <TabsTrigger value="status">등록 현황</TabsTrigger>
        </TabsList>

        {/* 등록 탭 */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>새 얼굴 등록</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 사용자 선택 */}
              <div>
                <label className="block text-sm font-medium mb-2">사용자 선택</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full h-9 px-3 py-1 text-sm rounded-md border border-input bg-transparent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">사용자를 선택하세요</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) {hasEmbedding(user.id) && '- 등록됨'}
                    </option>
                  ))}
                </select>
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium mb-2">얼굴 이미지</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              {/* 미리보기 */}
              {previewUrl && (
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-w-xs max-h-64 rounded-lg border border-border"
                  />
                </div>
              )}

              {/* 업로드 버튼 */}
              <Button
                onClick={handleUpload}
                disabled={!selectedUserId || !faceImage || uploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? '업로드 중...' : '얼굴 등록'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 현황 탭 */}
        <TabsContent value="status">
          <div className="space-y-4">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">전체 사용자</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{users.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">얼굴 등록됨</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{registeredCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">미등록</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-yellow-600">{unregisteredCount}</p>
                </CardContent>
              </Card>
            </div>

            {/* 사용자 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>사용자 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map((user) => {
                    const hasEmbed = hasEmbedding(user.id);
                    return (
                      <div
                        key={user.id}
                        className="flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {hasEmbed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-yellow-600" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium">{user.name}</p>
                            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                            {user.department && (
                              <p className="text-xs text-muted-foreground">{user.department}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                          <Badge variant={hasEmbed ? 'default' : 'secondary'}>
                            {hasEmbed ? '등록됨' : '미등록'}
                          </Badge>
                          {hasEmbed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEmbedding(user.id)}
                              disabled={deletingUserId === user.id}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deletingUserId === user.id ? '삭제 중...' : '삭제'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
