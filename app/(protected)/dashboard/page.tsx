"use client";

import { GitCommit, Calendar, User, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { ToastTester } from "@/components/ToastTester";
interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

function Dashboard() {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://api.github.com/repos/sweeetmiso3777/coincounter/commits?per_page=10"
        );

        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        setCommits(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch commits"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">
            Loading commits...
          </h2>
          <p className="text-muted-foreground">
            Fetching latest updates from GitHub
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">
            Failed to load commits
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <ToastTester />
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Project Dashboard
          </h1>
          <p className="text-lg text-foreground">
            Recent commits from{" "}
            <a
              href="https://github.com/sweeetmiso3777/coincounter"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 dark:text-green-400 hover:underline font-medium"
            >
              sweeetmiso3777/coincounter
            </a>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {commits.length} recent commits loaded
          </p>
        </div>

        {/* Commits List */}
        <div className="space-y-4">
          {commits.map((commit, index) => {
            const { date, time } = formatDate(commit.commit.author.date);
            const shortSha = commit.sha.substring(0, 7);

            return (
              <div
                key={commit.sha}
                className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.6s ease-out forwards",
                  opacity: 0,
                }}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <GitCommit className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 truncate">
                        {commit.commit.message.split("\n")[0]}{" "}
                        {/* First line only */}
                      </h3>
                      <a
                        href={`https://github.com/sweeetmiso3777/coincounter/commit/${commit.sha}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded hover:bg-accent transition-colors"
                      >
                        {shortSha}
                      </a>
                    </div>

                    {/* Show full commit message if it has multiple lines */}
                    {commit.commit.message.includes("\n") && (
                      <p className="text-sm text-muted-foreground mb-3 whitespace-pre-line">
                        {commit.commit.message
                          .split("\n")
                          .slice(1)
                          .join("\n")
                          .trim()}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>
                          {commit.author?.login || commit.commit.author.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {date} at {time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-muted-foreground">
            🚀 Built with Next.js, Firebase, and shadcn/ui
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Data fetched from GitHub API • Updates automatically
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
