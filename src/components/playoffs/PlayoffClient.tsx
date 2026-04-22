'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Target,
  Image as ImageIcon,
  Award,
  BarChart3,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  LayoutGrid,
  Zap,
  Swords,
  Info,
  TrendingUp,
} from 'lucide-react';
import {
  ElegantCard as ElegantCardAny,
  FadeIn as FadeInAny,
  AnimatedNumber as AnimatedNumberAny,
  UserAvatar as UserAvatarAny,
  StatsTable as StatsTableAny,
} from '@/components/ui';
import { Section as SectionAny } from '@/components/layout';

const ElegantCard = ElegantCardAny as any;
const FadeIn = FadeInAny as any;
const AnimatedNumber = AnimatedNumberAny as any;
const UserAvatar = UserAvatarAny as any;
const StatsTable = StatsTableAny as any;
const Section = SectionAny as any;
import { getColorForUser } from '@/lib/constants/colors';
import { clsx } from 'clsx';
import Link from 'next/link';

interface LeaderboardRow {
  userId: string;
  userName: string;
  userIcon: string;
  colorIndex: number;
  points: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  imageUrl?: string;
  predictions: any[];
}

interface Team {
  id: number;
  name: string;
  image: string;
}

export default function PlayoffClient({
  leaderboard,
  teams,
}: {
  leaderboard: LeaderboardRow[];
  teams: Team[];
}) {
  const [selectedUser, setSelectedUser] = useState<LeaderboardRow | null>(null);

  const leaderboardColumns = [
    {
      key: 'rank',
      label: 'Pos',
      align: 'center',
      render: (_: any, __: any, index: number) => (
        <span
          className={clsx(
            'flex items-center justify-center w-7 h-7 mx-auto rounded-full text-xs font-bold',
            index === 0
              ? 'bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : index === 1
                ? 'bg-slate-300 text-slate-800'
                : index === 2
                  ? 'bg-amber-700 text-white'
                  : 'bg-muted text-muted-foreground'
          )}
        >
          {index + 1}
        </span>
      ),
    },
    {
      key: 'user_name',
      label: 'Usuario',
      align: 'left',
      render: (_: any, row: LeaderboardRow) => {
        const userColor = getColorForUser(row.userId, row.userName, row.colorIndex);
        return (
          <Link
            href={`/user/${row.userId || row.userName}`}
            className="flex items-center gap-3 cursor-pointer group/link"
          >
            <UserAvatar src={row.userIcon} alt={row.userName} size={36} />
            <span
              className={clsx(
                'font-bold tracking-tight text-lg group-hover/link:scale-105 transition-all duration-300 origin-left',
                userColor.text
              )}
            >
              {row.userName}
            </span>
          </Link>
        );
      },
    },
    {
      key: 'correctCount',
      label: 'Aciertos',
      align: 'center',
      color: 'emerald',
      render: (val: number, row: LeaderboardRow) => (
        <span className="text-sm font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.2)]">
          {val} / {row.totalCount}
        </span>
      ),
    },
    {
      key: 'accuracy',
      label: 'Precisión',
      align: 'center',
      color: 'cyan',
      render: (val: number) => (
        <div className="flex items-center justify-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden md:block">
            <div className="h-full bg-cyan-500" style={{ width: `${val}%` }} />
          </div>
          <span className="text-xs font-mono font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">
            {val.toFixed(0)}%
          </span>
        </div>
      ),
    },
    {
      key: 'points',
      label: 'Puntos',
      align: 'right',
      color: 'primary',
      render: (val: number) => (
        <span className="font-black text-2xl drop-shadow-[0_0_8px_rgba(250,80,1,0.4)]">{val}</span>
      ),
    },
    {
      key: 'action',
      label: 'Predicción',
      align: 'right',
      color: 'rose',
      sortable: false,
      render: (_: any, row: LeaderboardRow) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(row);
          }}
          className="p-2 hover:bg-rose-500/20 rounded-full transition-all group-hover:scale-110 cursor-pointer border border-rose-500/10 bg-rose-500/5"
        >
          <ImageIcon className="w-5 h-5 text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.4)] cursor-pointer" />
        </button>
      ),
    },
  ];

  return (
    <div className="pb-20">
      {/* Quick Stats Section */}
      <Section
        title="Resumen Playoffs"
        subtitle="Principales hitos de la competición actual."
        delay={100}
        background="section-base"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ElegantCard title="Líder Actual" icon={Trophy} color="primary" bgColor="primary">
              <p className="text-3xl font-black mt-2 text-primary drop-shadow-[0_0_10px_rgba(250,80,1,0.3)]">
                {leaderboard[0]?.userName || '---'}
              </p>
            </ElegantCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ElegantCard title="Puntos Máximos" icon={Award} color="rose" bgColor="rose">
              <div className="flex items-baseline gap-1 mt-2 text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.3)]">
                <AnimatedNumber
                  value={leaderboard[0]?.points || 0}
                  className="text-4xl font-black"
                />
                <span className="text-sm font-black uppercase tracking-widest">PTS</span>
              </div>
            </ElegantCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ElegantCard title="Mejor Precisión" icon={Target} color="cyan" bgColor="cyan">
              <div className="flex items-baseline gap-1 mt-2 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                <span className="text-4xl font-black">
                  {Math.max(...leaderboard.map((u) => u.accuracy || 0)).toFixed(1)}%
                </span>
              </div>
            </ElegantCard>
          </motion.div>
        </div>
      </Section>

      {/* Main Leaderboard Section */}
      <Section
        title="Clasificación General"
        subtitle="Ranking basado en los puntos acumulados por cada acierto."
        delay={200}
        background="section-raised"
      >
        <div className="space-y-8">
          <StatsTable
            title="Tabla de Predicciones"
            icon={TrendingUp}
            data={leaderboard}
            columns={leaderboardColumns}
            showManagerColumn={false}
            className="h-auto"
          />

          <ElegantCard title="Sistema de Puntos" icon={Trophy} color="primary" bgColor="zinc">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: 'Play-in',
                  pts: 1,
                  icon: Play,
                  barClass: 'bg-blue-500/50',
                  iconClass: 'text-blue-400',
                  weight: 'w-[10%]',
                },
                {
                  label: 'Cuartos',
                  pts: 3,
                  icon: LayoutGrid,
                  barClass: 'bg-emerald-500/50',
                  iconClass: 'text-emerald-400',
                  weight: 'w-[30%]',
                },
                {
                  label: 'Semis',
                  pts: 6,
                  icon: Zap,
                  barClass: 'bg-amber-500/50',
                  iconClass: 'text-amber-400',
                  weight: 'w-[60%]',
                },
                {
                  label: 'Final',
                  pts: 10,
                  icon: Trophy,
                  barClass: 'bg-primary/50',
                  iconClass: 'text-primary',
                  weight: 'w-full',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="relative group/item overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.05]"
                >
                  <div
                    className={clsx('absolute bottom-0 left-0 h-1', item.barClass, item.weight)}
                  />
                  <div className="relative z-10 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <item.icon className={clsx('w-5 h-5', item.iconClass)} />
                      <span
                        className={clsx(
                          'text-xs font-black uppercase tracking-widest',
                          item.iconClass
                        )}
                      >
                        +{item.pts} pts
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-300">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </ElegantCard>
        </div>
      </Section>

      {/* User Detail Modal / Prediction Image */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <UserAvatar src={selectedUser.userIcon} alt={selectedUser.userName} size={48} />
                  <div>
                    <h3 className="text-xl font-bold">{selectedUser.userName}</h3>
                    <p className="text-sm text-muted-foreground">Predicciones de Playoffs</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
                >
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
                {selectedUser.imageUrl ? (
                  <div className="space-y-6">
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-border shadow-inner bg-muted">
                      <img
                        src={selectedUser.imageUrl}
                        alt={`Predicción de ${selectedUser.userName}`}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.predictions
                        .sort((a: any, b: any) => {
                          const priority: Record<string, number> = {
                            'play-in': 1,
                            quarter: 2,
                            semi: 3,
                            final: 4,
                          };
                          return (priority[a.stage] || 99) - (priority[b.stage] || 99);
                        })
                        .map((pred: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
                          >
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                {pred.stage} - {pred.matchId}
                              </span>
                              <span className="font-semibold">
                                {teams.find((t) => t.id === pred.predictedWinnerId)?.name ||
                                  'Desconocido'}
                              </span>
                            </div>
                            {pred.isCorrect === true && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            )}
                            {pred.isCorrect === false && (
                              <XCircle className="w-5 h-5 text-rose-500" />
                            )}
                            {pred.isCorrect === null && (
                              <HelpCircle className="w-5 h-5 text-muted-foreground/50" />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="p-6 bg-muted rounded-full">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold">Sin imagen disponible</h4>
                      <p className="text-muted-foreground max-w-xs mx-auto">
                        Este usuario aún no ha subido su captura de pantalla de las predicciones.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
