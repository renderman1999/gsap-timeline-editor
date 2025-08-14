"use client";

import { useState } from "react";
import { Plus, Copy, Trash2, Play, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTimelineStore } from "@/stores/timeline-store";

export function TimelinesSidebar() {
  const {
    timelines,
    activeTimelineId,
    addTimeline,
    updateTimeline,
    deleteTimeline,
    setActiveTimeline,
    generateUniqueTimelineName,
  } = useTimelineStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [newTimelineForm, setNewTimelineForm] = useState({
    name: "",
    playbackType: "normal" as "normal" | "scroll",
    scrollLength: 300,
    loop: false,
    yoyo: false,
  });

  const handleAddTimeline = () => {
    const name =
      newTimelineForm.name || generateUniqueTimelineName("New Animation");

    addTimeline({
      name,
      playbackType: newTimelineForm.playbackType,
      scrollLength:
        newTimelineForm.playbackType === "scroll"
          ? newTimelineForm.scrollLength
          : undefined,
      loop: newTimelineForm.loop,
      yoyo: newTimelineForm.yoyo,
      keyframes: [],
    });

    setNewTimelineForm({
      name: "",
      playbackType: "normal",
      scrollLength: 300,
      loop: false,
      yoyo: false,
    });
    setIsAddDialogOpen(false);
  };

  const handleStartEdit = (timeline: { id: string; name: string }) => {
    setEditingId(timeline.id);
    setEditingName(timeline.name);
  };

  const handleDuplicateTimeline = (timelineId: string) => {
    const timeline = timelines.find((t) => t.id === timelineId);
    if (!timeline) return;

    const name = generateUniqueTimelineName(`${timeline.name} Copy`);

    addTimeline({
      name,
      playbackType: timeline.playbackType,
      scrollLength:
        timeline.playbackType === "scroll" ? timeline.scrollLength : undefined,
      loop: timeline.loop,
      yoyo: timeline.yoyo,
      keyframes: JSON.parse(JSON.stringify(timeline.keyframes)),
      targetShape: timeline.targetShape,
    });
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateTimeline(editingId, { name: editingName.trim() });
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="w-80 border-r border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Timelines</h2>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[400px]">
            <DialogHeader>
              <DialogTitle>New Timeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  id="name"
                  value={newTimelineForm.name || "New Animation"}
                  onChange={(e) =>
                    setNewTimelineForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              {/* <div>
                <Label htmlFor="playback">Playback</Label>
                <Select
                  value={newTimelineForm.playbackType}
                  onValueChange={(value: "normal" | "scroll") =>
                    setNewTimelineForm((prev) => ({
                      ...prev,
                      playbackType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="scroll">Scroll</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              {/* {newTimelineForm.playbackType === "scroll" && (
                <div>
                  <Label htmlFor="scrollLength">Length (%)</Label>
                  <Input
                    id="scrollLength"
                    type="number"
                    value={newTimelineForm.scrollLength}
                    onChange={(e) =>
                      setNewTimelineForm((prev) => ({
                        ...prev,
                        scrollLength: parseInt(e.target.value) || 300,
                      }))
                    }
                  />
                </div>
              )} */}

              <div className="flex items-center space-x-2">
                <Switch
                  id="loop"
                  checked={newTimelineForm.loop}
                  onCheckedChange={(checked) =>
                    setNewTimelineForm((prev) => ({ ...prev, loop: checked }))
                  }
                />
                <Label htmlFor="loop">Loop</Label>
              </div>

              {newTimelineForm.loop && (
                <div className="flex items-center space-x-2 ml-6">
                  <Switch
                    id="yoyo"
                    checked={newTimelineForm.yoyo}
                    onCheckedChange={(checked) =>
                      setNewTimelineForm((prev) => ({ ...prev, yoyo: checked }))
                    }
                  />
                  <Label htmlFor="yoyo">Yo-yo</Label>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddTimeline} className="flex-1">
                  Add Timeline
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {timelines.map((timeline) => (
          <Card
            key={timeline.id}
            className={`p-3 cursor-pointer transition-colors ${
              activeTimelineId === timeline.id
                ? "bg-primary/10 border-primary"
                : "hover:bg-accent"
            }`}
            onClick={() => setActiveTimeline(timeline.id)}
          >
            <div className="flex items-center justify-between">
              {editingId === timeline.id ? (
                <div className="flex-1 flex gap-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    className="h-8"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleSaveEdit}>
                    ✓
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Play className="h-3 w-3 text-primary shrink-0" />
                      <span className="font-medium">
                        {timeline.name}{" "}
                        <div
                          className="ml-1 cursor-pointer"
                          style={{ display: "inline-block" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(timeline);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </div>
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {timeline.keyframes.length} keyframes
                      {timeline.loop && " • Loop"}
                      {/* {timeline.playbackType === "scroll" && " • Scroll"} */}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Duplicate timeline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateTimeline(timeline.id);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Delete timeline"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTimeline(timeline.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
