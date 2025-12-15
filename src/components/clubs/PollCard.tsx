"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Vote, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PollData {
  id: string;
  question: string;
  options: string[];
  allow_multiple: boolean;
  end_date: string | null;
  is_closed: boolean;
}

interface PollCardProps {
  pollData: PollData;
  clubId: string;
  postId: string;
  voteCounts: Record<number, number>;
  totalVotes: number;
  userVote: number[] | null;
  hasVoted: boolean;
  onVoteUpdate?: () => void;
}

export default function PollCard({
  pollData,
  clubId,
  postId,
  voteCounts: initialVoteCounts,
  totalVotes: initialTotalVotes,
  userVote: initialUserVote,
  hasVoted: initialHasVoted,
  onVoteUpdate,
}: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    initialUserVote || []
  );
  const [voteCounts, setVoteCounts] = useState(initialVoteCounts);
  const [totalVotes, setTotalVotes] = useState(initialTotalVotes);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(initialHasVoted);

  const isExpired = pollData.end_date
    ? new Date(pollData.end_date) < new Date()
    : false;
  const isClosed = pollData.is_closed || isExpired;

  const formatEndDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSingleSelect = (index: string) => {
    setSelectedOptions([parseInt(index)]);
  };

  const handleMultiSelect = (index: number, checked: boolean) => {
    if (checked) {
      setSelectedOptions([...selectedOptions, index]);
    } else {
      setSelectedOptions(selectedOptions.filter((i) => i !== index));
    }
  };

  const handleSubmitVote = async () => {
    if (selectedOptions.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/clubs/${clubId}/posts/${postId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionIndexes: selectedOptions }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        console.error("Vote error:", result.error);
        return;
      }

      setVoteCounts(result.data.voteCounts);
      setTotalVotes(result.data.totalVotes);
      setUserVote(result.data.userVote);
      setHasVoted(result.data.hasVoted);
      setShowResults(true);
      onVoteUpdate?.();
    } catch (error) {
      console.error("Vote submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelVote = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/clubs/${clubId}/posts/${postId}/vote`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!result.success) {
        console.error("Vote cancel error:", result.error);
        return;
      }

      setVoteCounts(result.data.voteCounts);
      setTotalVotes(result.data.totalVotes);
      setUserVote(null);
      setHasVoted(false);
      setSelectedOptions([]);
      setShowResults(false);
      onVoteUpdate?.();
    } catch (error) {
      console.error("Vote cancel error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVotePercentage = (index: number) => {
    if (totalVotes === 0) return 0;
    return Math.round(((voteCounts[index] || 0) / totalVotes) * 100);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Vote className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{pollData.question}</CardTitle>
          </div>
          {isClosed ? (
            <Badge variant="secondary">마감</Badge>
          ) : pollData.allow_multiple ? (
            <Badge variant="outline">복수 선택</Badge>
          ) : null}
        </div>
        {pollData.end_date && !isClosed && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatEndDate(pollData.end_date)} 마감</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voting Options or Results */}
        {showResults || isClosed ? (
          // Show Results
          <div className="space-y-3">
            {pollData.options.map((option, index) => {
              const percentage = getVotePercentage(index);
              const count = voteCounts[index] || 0;
              const isUserChoice = userVote?.includes(index);

              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {isUserChoice && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                      <span className={cn(isUserChoice && "font-medium")}>
                        {option}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {count}표 ({percentage}%)
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    className={cn(
                      "h-2",
                      isUserChoice && "[&>div]:bg-primary"
                    )}
                  />
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                총 {totalVotes}명 참여
              </span>
              {hasVoted && !isClosed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelVote}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "투표 취소"
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Show Voting Options
          <div className="space-y-3">
            {pollData.allow_multiple ? (
              // Multiple Choice
              <div className="space-y-2">
                {pollData.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() =>
                      handleMultiSelect(index, !selectedOptions.includes(index))
                    }
                  >
                    <Checkbox
                      id={`option-${index}`}
                      checked={selectedOptions.includes(index)}
                      onCheckedChange={(checked) =>
                        handleMultiSelect(index, !!checked)
                      }
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            ) : (
              // Single Choice
              <RadioGroup
                value={selectedOptions[0]?.toString()}
                onValueChange={handleSingleSelect}
              >
                {pollData.options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSingleSelect(index.toString())}
                  >
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(true)}
              >
                결과 보기
              </Button>
              <Button
                onClick={handleSubmitVote}
                disabled={selectedOptions.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    투표 중...
                  </>
                ) : (
                  "투표하기"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Toggle View Button when showing results but haven't voted */}
        {showResults && !hasVoted && !isClosed && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowResults(false)}
          >
            투표하기
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
