import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Trophy, 
  Medal, 
  Award, 
  MoreHorizontal,
  Eye,
  MessageCircle,
  Star,
  TrendingUp,
  Target
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CandidateRankingWithApplication {
  id: string;
  rank_position: number;
  overall_score: number;
  match_percentage: number;
  applications: {
    id: string;
    first_name: string;
    last_name: string;
    applicant_email: string;
    phone: string;
    applied_at: string;
    status: string;
  };
}

interface CandidateRankingTableProps {
  rankings: CandidateRankingWithApplication[];
  onViewApplication?: (applicationId: string) => void;
  onContactCandidate?: (candidateEmail: string, candidateName: string) => void;
  isLoading?: boolean;
}

const CandidateRankingTable: React.FC<CandidateRankingTableProps> = ({
  rankings = [],
  onViewApplication,
  onContactCandidate,
  isLoading = false
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="w-4 h-4 text-center text-xs font-medium">{position}</span>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'hired':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'interviewing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'reviewed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Candidate Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading rankings...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rankings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Candidate Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Rankings Available</h3>
              <p className="text-muted-foreground">
                Run AI analysis on candidate applications to see rankings here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Candidate Rankings
          </CardTitle>
          <Badge variant="outline">
            {rankings.length} candidate{rankings.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((ranking) => (
                <TableRow 
                  key={ranking.id}
                  className={selectedCandidate === ranking.applications.id ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {getRankIcon(ranking.rank_position)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(ranking.applications.first_name, ranking.applications.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {ranking.applications.first_name} {ranking.applications.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ranking.applications.applicant_email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={getScoreColor(ranking.overall_score)}>
                      {Math.round(ranking.overall_score)}/100
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {Math.round(ranking.match_percentage)}%
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={getStatusColor(ranking.applications.status)}
                    >
                      {ranking.applications.status}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(ranking.applications.applied_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => onViewApplication?.(ranking.applications.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Application
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onContactCandidate?.(
                            ranking.applications.applicant_email,
                            `${ranking.applications.first_name} ${ranking.applications.last_name}`
                          )}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Contact Candidate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CandidateRankingTable;