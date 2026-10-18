import styles from './schedule-desktop.module.css';

/** @param {{players?: import('../models/schedule').SchedulePlayer[]}} props */
export default function RoundSummary({ players = [] }) {
  if (!players.length) return null;
  return (
    <dl className={styles.summary} aria-label="Resumen de la plantilla">
      <div>
        <dt>Jugadores</dt>
        <dd>{players.length}</dd>
      </div>
      <div>
        <dt>Puntos</dt>
        <dd>{players.reduce((sum, player) => sum + (player.puntos ?? 0), 0)}</dd>
      </div>
    </dl>
  );
}
