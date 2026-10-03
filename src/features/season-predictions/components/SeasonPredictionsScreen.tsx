'use client';

import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';
import { MobileScreen, MobileScreenHeader } from '@/components/mobile/MobileScreen';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  PageCanvas,
  PageHeader,
  PageSection,
  SectionHeader,
} from '@/components/ui/foundation';
import type { PredictionChoice, SeasonPredictionOptions } from '../models/options';
import {
  PREDICTION_SECTIONS,
  type PredictionAnswer,
  type PredictionAnswers,
  type PredictionQuestion,
  type PredictionQuestionId,
} from '../models/questions';
import type { SeasonPredictionsPageData } from '../models/submission';
import { PredictionQuestionCard } from './PredictionQuestionCard';
import { RankingPredictionCard } from './RankingPredictionCard';

type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

function choicesFor(
  question: PredictionQuestion,
  options: SeasonPredictionOptions
): PredictionChoice[] {
  return question.section === 'player'
    ? options.players
    : question.section === 'team'
      ? options.teams
      : options.managers;
}

function answerText(
  question: PredictionQuestion,
  answer: PredictionAnswer | undefined,
  options: SeasonPredictionOptions
) {
  if (!answer) return 'Sin respuesta';
  const names = new Map(choicesFor(question, options).map((choice) => [choice.id, choice.name]));
  if (answer.kind === 'single') return names.get(answer.id) ?? 'Candidato desconocido';
  return answer.ids
    .map((id, index) => `${index + 1}. ${names.get(id) ?? 'Candidato desconocido'}`)
    .join(' · ');
}

export function SeasonPredictionsScreen({
  seasonName,
  data,
  phone = false,
}: {
  seasonName: string;
  data: SeasonPredictionsPageData;
  phone?: boolean;
}) {
  const [answers, setAnswers] = useState<PredictionAnswers>(data.submission?.answers ?? {});
  const [savedAnswers, setSavedAnswers] = useState<PredictionAnswers>(
    data.submission?.answers ?? {}
  );
  const [revision, setRevision] = useState(data.submission?.revision ?? 0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [serverLocked, setServerLocked] = useState(false);
  const [message, setMessage] = useState('');
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() =>
    data.locksAt
      ? Math.max(0, Math.ceil((Date.parse(data.locksAt) - Date.parse(data.serverNow)) / 1000))
      : null
  );
  const dirty = JSON.stringify(answers) !== JSON.stringify(savedAnswers);
  const readOnly = data.status !== 'open' || secondsLeft === 0 || serverLocked;

  useEffect(() => {
    if (data.status !== 'open' || !data.locksAt) return;
    const offset = Date.parse(data.serverNow) - Date.now();
    const update = () =>
      setSecondsLeft(
        Math.max(0, Math.ceil((Date.parse(data.locksAt!) - Date.now() - offset) / 1000))
      );
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [data.status, data.locksAt, data.serverNow]);

  useEffect(() => {
    if (saveState !== 'saved') return;
    const timer = window.setTimeout(() => setSaveState('idle'), 3500);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  function updateAnswer(id: PredictionQuestionId, answer: PredictionAnswer | null) {
    setAnswers((current) => {
      const next = { ...current };
      if (answer) next[id] = answer;
      else delete next[id];
      return next;
    });
    if (saveState !== 'conflict') {
      setSaveState('idle');
      setMessage('');
    }
  }

  async function save() {
    if (!dirty || readOnly || saveState === 'saving' || saveState === 'conflict') return;
    setSaveState('saving');
    setMessage('');
    const submitted = answers;
    try {
      const response = await fetch('/api/season-predictions/submission', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId: data.seasonId, revision, answers: submitted }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.code === 'locked') setServerLocked(true);
        setSaveState(response.status === 409 && result.code === 'conflict' ? 'conflict' : 'error');
        setMessage(result.message ?? 'No se pudieron guardar las predicciones.');
        return;
      }
      setSavedAnswers(submitted);
      setRevision(result.submission.revision);
      setSaveState('saved');
      setMessage('Predicciones guardadas. Puedes modificarlas hasta el cierre.');
    } catch {
      setSaveState('error');
      setMessage(
        'No se pudieron guardar las predicciones. Revisa tu conexión e inténtalo de nuevo.'
      );
    }
  }

  const status =
    data.status === 'not-open'
      ? 'Las predicciones todavía no están abiertas.'
      : data.status === 'locked' || secondsLeft === 0 || serverLocked
        ? 'El plazo ha terminado. Tus respuestas están bloqueadas.'
        : `Puedes guardar y modificar tus respuestas hasta el ${data.locksAtLabel}.`;
  const hours = secondsLeft == null ? null : Math.floor(secondsLeft / 3600);
  const remaining =
    hours == null
      ? ''
      : hours >= 24
        ? `${Math.floor(hours / 24)} d ${hours % 24} h`
        : `${hours} h ${Math.floor((secondsLeft! % 3600) / 60)} min`;
  const statusPanel = (
    <div className="max-w-3xl space-y-2 rounded-[var(--radius-control)] border border-[hsl(var(--border-default))] bg-[hsl(var(--surface-secondary))] px-4 py-3 text-sm leading-relaxed text-[hsl(var(--content-secondary))]">
      <p>{status}</p>
      {data.status === 'open' && secondsLeft != null && secondsLeft > 0 ? (
        <p>
          Tiempo restante aproximado: <strong>{remaining}</strong>. El servidor decide el cierre.
        </p>
      ) : null}
      {data.status === 'open' && !readOnly ? (
        <p>
          Las respuestas solo se guardan al pulsar «Guardar predicciones». Los demás miembros podrán
          verlas después del cierre.
        </p>
      ) : null}
      {data.status === 'open' && readOnly ? (
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Actualizar estado
        </Button>
      ) : null}
    </div>
  );
  const phoneOpenPanel = (
    <div className="rounded-[var(--radius-surface)] border border-[hsl(var(--border-default))] bg-[hsl(var(--surface-card))] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[hsl(var(--action-primary))]">
          Plazo abierto
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--action-primary)/0.1)] px-2.5 py-1 text-xs font-semibold tabular-nums text-[hsl(var(--action-primary))]">
          <Clock3 size={14} aria-hidden="true" />
          {remaining}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--content-primary))]">
        Puedes guardar y modificar tus respuestas hasta el {data.locksAtLabel}.
      </p>
      <p className="mt-3 border-t border-[hsl(var(--border-default))] pt-3 text-xs leading-relaxed text-[hsl(var(--content-muted))]">
        Las respuestas solo se guardan al pulsar «Guardar predicciones». Los demás miembros podrán
        verlas después del cierre.
      </p>
    </div>
  );
  const closedPanel = (
    <Card className="mx-auto w-full max-w-2xl p-0!">
      <CardContent className="flex flex-col items-center gap-5 px-5 py-10 text-center sm:px-10 sm:py-12">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full border border-[hsl(var(--action-primary)/0.24)] bg-[hsl(var(--action-primary)/0.1)] text-[hsl(var(--action-primary))]"
        >
          <Clock3 size={25} />
        </span>
        <div className="space-y-3">
          <CardTitle as="h2" className="text-xl! leading-tight sm:text-2xl!">
            Las predicciones todavía no están abiertas.
          </CardTitle>
          <CardDescription className="mx-auto max-w-lg text-base leading-relaxed">
            Cuando comience el plazo, podrás elegir jugadores, equipos y mánagers. Tendrás siete
            días para guardar y cambiar tus respuestas.
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );

  const sections =
    data.status === 'not-open'
      ? null
      : PREDICTION_SECTIONS.map((section, index) => (
          <PageSection
            key={section.id}
            id={section.id}
            aria-labelledby={`${section.id}-heading`}
            tone={index % 2 === 0 ? 'base' : 'alternate'}
            inset={phone ? 'phone' : 'responsive'}
          >
            <div className="space-y-5">
              <SectionHeader
                headingId={`${section.id}-heading`}
                title={section.title}
                description={section.description}
                action={
                  phone && data.status === 'open' ? (
                    <span className="rounded-full border border-[hsl(var(--border-default))] px-3 py-1 text-xs font-semibold tabular-nums text-[hsl(var(--content-secondary))]">
                      {
                        data.questions.filter(
                          (question) =>
                            question.section === section.id &&
                            answers[question.id as PredictionQuestionId]
                        ).length
                      }{' '}
                      de{' '}
                      {data.questions.filter((question) => question.section === section.id).length}
                    </span>
                  ) : undefined
                }
              />
              <div className={`grid lg:grid-cols-2 ${phone ? 'gap-3' : 'gap-4'}`}>
                {data.questions
                  .filter((question) => question.section === section.id)
                  .sort((a, b) => a.order - b.order)
                  .map((question) => {
                    const answer = answers[question.id as PredictionQuestionId];
                    if (question.kind === 'ranking')
                      return (
                        <RankingPredictionCard
                          key={question.id}
                          question={question}
                          options={choicesFor(question, data.options)}
                          value={answer?.kind === 'ranking' ? answer.ids : null}
                          onChange={(ids) =>
                            updateAnswer(
                              question.id as PredictionQuestionId,
                              ids ? { kind: 'ranking', ids } : null
                            )
                          }
                          disabled={readOnly}
                          phone={phone}
                        />
                      );
                    return (
                      <PredictionQuestionCard
                        key={question.id}
                        question={question}
                        options={data.options}
                        value={answer?.kind === 'single' ? answer.id : null}
                        disabled={readOnly}
                        phone={phone}
                        onChange={(id) =>
                          updateAnswer(
                            question.id as PredictionQuestionId,
                            id ? { kind: 'single', id } : null
                          )
                        }
                      />
                    );
                  })}
              </div>
            </div>
          </PageSection>
        ));

  const savePanel =
    data.status === 'open' && !readOnly ? (
      <div className="flex flex-wrap items-center gap-4 py-8">
        <Button
          onClick={save}
          disabled={!dirty || saveState === 'saving' || saveState === 'conflict'}
          className="min-h-12"
        >
          {saveState === 'saving' ? 'Guardando…' : 'Guardar predicciones'}
        </Button>
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${saveState === 'error' || saveState === 'conflict' ? 'text-[hsl(var(--status-danger))]' : 'text-[hsl(var(--content-secondary))]'}`}
        >
          {message ||
            (dirty
              ? 'Hay cambios sin guardar.'
              : revision
                ? 'Todos los cambios están guardados.'
                : 'Aún no has guardado respuestas.')}
        </p>
        {saveState === 'conflict' ? (
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Recargar respuestas
          </Button>
        ) : null}
      </div>
    ) : null;

  const phoneSavePanel =
    data.status === 'open' && !readOnly ? (
      <div
        className={
          dirty || saveState === 'saved'
            ? 'fixed inset-x-0 bottom-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px))] z-[70] space-y-2 border-t border-[hsl(var(--border-default))] bg-[hsl(var(--surface-app)/0.96)] px-4 py-3 shadow-lg backdrop-blur-xl landscape:static landscape:shadow-none'
            : 'px-4 py-6'
        }
      >
        {dirty ? (
          <Button
            className="min-h-12 w-full"
            onClick={save}
            disabled={saveState === 'saving' || saveState === 'conflict'}
          >
            {saveState === 'saving' ? 'Guardando…' : 'Guardar predicciones'}
          </Button>
        ) : null}
        <p
          role="status"
          aria-live="polite"
          className={`text-center text-sm ${saveState === 'error' || saveState === 'conflict' ? 'text-[hsl(var(--status-danger))]' : 'text-[hsl(var(--content-secondary))]'}`}
        >
          {message ||
            (dirty
              ? 'Hay cambios sin guardar.'
              : revision
                ? 'Todos los cambios están guardados.'
                : 'Aún no has guardado respuestas.')}
        </p>
        {saveState === 'conflict' ? (
          <Button variant="secondary" className="w-full" onClick={() => window.location.reload()}>
            Recargar respuestas
          </Button>
        ) : null}
      </div>
    ) : null;

  const league =
    data.status === 'locked' && data.league ? (
      <PageSection
        id="league"
        aria-labelledby="league-heading"
        tone="alternate"
        inset={phone ? 'phone' : 'responsive'}
      >
        <div className="space-y-5">
          <SectionHeader
            headingId="league-heading"
            title="Predicciones de la liga"
            description="Respuestas guardadas por los miembros de esta temporada."
          />
          {data.league.length ? (
            <div className="space-y-3">
              {data.league.map((member) => (
                <details
                  key={member.userId}
                  className="rounded-[var(--radius-surface)] border border-[hsl(var(--border-default))] bg-[hsl(var(--surface-secondary))] p-4"
                >
                  <summary className="cursor-pointer font-semibold focus-visible:outline-2 focus-visible:outline-[hsl(var(--focus-ring))]">
                    {member.name}
                  </summary>
                  <dl className="mt-4 space-y-3">
                    {data.questions.map((question) => (
                      <div key={question.id}>
                        <dt className="text-sm font-medium">{question.prompt}</dt>
                        <dd className="break-words text-sm text-[hsl(var(--content-secondary))]">
                          {answerText(
                            question,
                            member.answers[question.id as PredictionQuestionId],
                            data.options
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
            </div>
          ) : (
            <p>Aún no hay predicciones guardadas.</p>
          )}
        </div>
      </PageSection>
    ) : null;

  if (phone)
    return (
      <MobileScreen
        labelledBy="mobile-screen-title"
        className={
          dirty ? 'pb-[calc(var(--mobile-nav-height)+env(safe-area-inset-bottom,0px)+10rem)]!' : ''
        }
      >
        <MobileScreenHeader eyebrow={seasonName} title="Predicciones" />
        <div className="px-4 py-8">
          {data.status === 'not-open'
            ? closedPanel
            : data.status === 'open' && !readOnly
              ? phoneOpenPanel
              : statusPanel}
        </div>
        {sections}
        {league}
        {phoneSavePanel}
      </MobileScreen>
    );

  return (
    <>
      <PageCanvas className="pb-8 lg:pb-10">
        <div className="space-y-10">
          <PageHeader
            title="Predicciones de temporada"
            description="Anticipa los protagonistas, las sorpresas y las clasificaciones finales."
          />
          {data.status === 'not-open' ? (
            <div className="py-4 sm:py-10">{closedPanel}</div>
          ) : (
            statusPanel
          )}
        </div>
      </PageCanvas>
      {sections}
      {league}
      {savePanel ? <PageCanvas>{savePanel}</PageCanvas> : null}
    </>
  );
}
