/* eslint-disable react/prop-types */
// TournamentSection component handles student tournaments: standings, photos, upcoming tournaments and protected editing
import { useMemo, useState } from "react";
import {
    FaBasketballBall,
    FaCalendarAlt,
    FaCamera,
    FaChevronLeft,
    FaChevronRight,
    FaEdit,
    FaFutbol,
    FaPlus,
    FaRegTrashAlt,
    FaTable,
    FaTimes,
    FaTrophy,
    FaUsers,
    FaVolleyballBall,
} from "react-icons/fa";
import basketballImage from "../../assets/img/Basketball-3d-icon.png";
import volleyballImage from "../../assets/img/Volleyball-icon.png";
import soccerImage from "../../assets/img/Soccer-icon.png";
import campusImage from "../../assets/img/coding_with_friends_historias26042024_2.jpg";
import crowdImage from "../../assets/img/coding_with_friends_historias_2024_2309_022_800x800.jpg";
import "./tournaments.scss";
import { loadTournamentData } from "./data-loader";
import { createCrudItem, deleteCrudItem, makeId, updateCrudItem, verifyCrudPassword } from "./crud-manager";
import { getModalTitle, stopModalPropagation } from "./modal";

const initialData = loadTournamentData();

const baseSports = [
    { id: "basketball", label: "Baloncesto", icon: FaBasketballBall, accent: "#F59E0B" },
    { id: "volleyball", label: "Voleibol", icon: FaVolleyballBall, accent: "#A3E635" },
    { id: "football", label: "Fútbol", icon: FaFutbol, accent: "#22C55E" },
    { id: "futsal", label: "Fútbol sala", icon: FaFutbol, accent: "#F97316" },
];

const tabOptions = [
    { id: "results", label: "Resultados último torneo", icon: FaTable },
    { id: "photos", label: "Fotos", icon: FaCamera },
    { id: "upcoming", label: "Próximos torneos", icon: FaCalendarAlt },
];

const sportImages = {
    basketball: basketballImage,
    volleyball: volleyballImage,
    football: soccerImage,
    futsal: campusImage,
};

const photoFallbacks = [campusImage, crowdImage, basketballImage, volleyballImage, soccerImage];

const standingColumns = {
    basketball: [
        ["position", "Posición"],
        ["team", "Equipo"],
        ["played", "PJ"],
        ["wins", "PG"],
        ["losses", "PP"],
        ["points_for", "PF"],
        ["points_against", "PC"],
        ["point_difference", "DIF"],
        ["tournament_points", "PTS"],
    ],
    volleyball: [
        ["position", "Posición"],
        ["team", "Equipo"],
        ["played", "PJ"],
        ["wins", "PG"],
        ["losses", "PP"],
        ["sets_won", "SW"],
        ["sets_lost", "SL"],
        ["set_difference", "DIF Sets"],
        ["points_for", "PF"],
        ["points_against", "PC"],
        ["tournament_points", "PTS"],
    ],
    football: [
        ["position", "Posición"],
        ["team", "Equipo"],
        ["played", "PJ"],
        ["wins", "PG"],
        ["draws", "PE"],
        ["losses", "PP"],
        ["goals_for", "GF"],
        ["goals_against", "GC"],
        ["goal_difference", "DIF"],
        ["points", "PTS"],
    ],
    futsal: [
        ["position", "Posición"],
        ["team", "Equipo"],
        ["played", "PJ"],
        ["wins", "PG"],
        ["draws", "PE"],
        ["losses", "PP"],
        ["goals_for", "GF"],
        ["goals_against", "GC"],
        ["goal_difference", "DIF"],
        ["points", "PTS"],
    ],
};

function getTeam(teams, teamId) {
    return teams.find((team) => team.team_id === teamId);
}

function getTeamByName(teams, teamName, sport) {
    return teams.find((team) => team.sport === sport && team.team_name === teamName);
}

function getParticipantOptions(item, teams) {
    if (!item || item.registered_teams === "Pendiente de asignar") {
        return teams.filter((team) => team.sport === item?.sport).map((team) => ({ id: team.team_id, label: team.team_name }));
    }

    return item.registered_teams.split(";").map((teamName) => {
        const cleanName = teamName.trim();
        const team = getTeamByName(teams, cleanName, item.sport);
        return {
            id: team?.team_id || cleanName,
            label: cleanName,
        };
    });
}

function getDisplayTeamName(teams, teamId) {
    return getTeam(teams, teamId)?.team_name || teamId || "Pendiente";
}

function getLastTournament(tournaments, sport) {
    const sportTournaments = tournaments.filter((tournament) => tournament.sport === sport && !["upcoming", "pending"].includes(tournament.status));
    return sportTournaments.sort((a, b) => new Date(b.end_date) - new Date(a.end_date))[0];
}

function formatDate(date) {
    if (!date) return "Fecha pendiente";
    return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

function getPhotoImage(photo, index) {
    const uploadedImage = photo.image_url || "";
    if (uploadedImage.startsWith("data:image/") || uploadedImage.startsWith("blob:")) {
        return uploadedImage;
    }

    return photoFallbacks[index % photoFallbacks.length];
}

function getUpcomingImage(tournament, sport) {
    const uploadedImage = tournament.image_url || "";
    if (uploadedImage.startsWith("data:image/") || uploadedImage.startsWith("blob:")) {
        return uploadedImage;
    }

    return sportImages[sport];
}

const statusLabels = {
    finished: "Finalizado",
    in_progress: "En curso",
    upcoming: "Confirmado",
    pending: "Pendiente",
    scheduled: "Programado",
};

function getSportLabel(sport) {
    return baseSports.find((item) => item.id === sport)?.label || sport;
}

function getStatusLabel(status) {
    return statusLabels[status] || status;
}

function SportBadge({ sport }) {
    return <span className={`tournament-badge tournament-badge--${sport}`}>{getSportLabel(sport)}</span>;
}

function SportsSidebar({ sports, activeSport, teams, isCollapsed, onSportChange, onCrud, onToggle }) {
    return (
        <aside className={`sports-sidebar ${isCollapsed ? "sports-sidebar--collapsed" : ""}`} aria-label="Navbar lateral de disciplinas">
            <div className="sports-sidebar__header">
                <p>Disciplinas</p>
                <div className="sports-sidebar__actions">
                    {!isCollapsed && (
                        <button type="button" className="icon-button" aria-label="Agregar disciplina" onClick={() => onCrud("sport", "create")}>
                            <FaPlus />
                        </button>
                    )}
                    <button
                        type="button"
                        className="icon-button sports-sidebar__toggle"
                        aria-label={isCollapsed ? "Mostrar disciplinas" : "Ocultar disciplinas"}
                        aria-expanded={!isCollapsed}
                        onClick={onToggle}
                    >
                        {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
                    </button>
                </div>
            </div>

            <div className="sports-sidebar__list">
                {sports.map((sport) => {
                    const Icon = sport.icon;
                    const teamCount = teams.filter((team) => team.sport === sport.id).length;
                    return (
                        <button
                            key={sport.id}
                            type="button"
                            className={`sport-option ${activeSport === sport.id ? "sport-option--active" : ""}`}
                            style={{ "--sport-accent": sport.accent }}
                            onClick={() => onSportChange(sport.id)}
                            title={isCollapsed ? sport.label : undefined}
                        >
                            <span className="sport-option__icon">
                                <Icon />
                            </span>
                            <span className="sport-option__label">
                                <strong>{sport.label}</strong>
                                <small>{teamCount} equipos activos</small>
                            </span>
                            {!isCollapsed && (
                                <span className="sport-option__tools">
                                    <FaEdit
                                        aria-label={`Editar ${sport.label}`}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onCrud("sport", "edit", sport);
                                        }}
                                    />
                                    <FaRegTrashAlt
                                        aria-label={`Eliminar ${sport.label}`}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onCrud("sport", "delete", sport);
                                        }}
                                    />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}

function TournamentTabs({ activeTab, onTabChange }) {
    return (
        <div className="tournament-tabs" role="tablist" aria-label="Vistas de torneos">
            {tabOptions.map((tab) => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        className={activeTab === tab.id ? "tournament-tabs__button tournament-tabs__button--active" : "tournament-tabs__button"}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <Icon />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

function ResultsTable({ sport, standings, teams, tournament, matches, onTeamSelect, onCrud }) {
    const columns = standingColumns[sport] || standingColumns.basketball;
    const rows = standings.filter((standing) => standing.sport === sport).sort((a, b) => a.position - b.position);
    const sportMatches = matches.filter((match) => match.sport === sport);

    return (
        <section className="tournament-panel" aria-label="Resultados último torneo">
            <div className="panel-heading">
                <div>
                    <p className="section-kicker">Clasificación</p>
                    <h2>{tournament?.tournament_name || "Último torneo"}</h2>
                    <span>{tournament ? `${formatDate(tournament.start_date)} - ${formatDate(tournament.end_date)}` : "Datos simulados"}</span>
                </div>
                <button type="button" className="tournament-action" onClick={() => onCrud("standing", "create")}>
                    <FaPlus /> Resultado
                </button>
            </div>

            <div className="table-scroll">
                <table className="results-table">
                    <thead>
                        <tr>
                            {columns.map(([, label]) => (
                                <th key={label}>{label}</th>
                            ))}
                            <th>Gestión</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const team = getTeam(teams, row.team_id);
                            return (
                                <tr key={row.standing_id} className={`podium-row podium-row--${row.position}`}>
                                    {columns.map(([key]) => (
                                        <td key={key}>
                                            {key === "team" ? (
                                                <button type="button" className="team-link" onClick={() => onTeamSelect(row)}>
                                                    <span className="team-dot" style={{ background: team?.primary_color || "#A3E635" }} />
                                                    {team?.team_name || row.team_id}
                                                </button>
                                            ) : row[key] === "" || row[key] === undefined ? (
                                                "-"
                                            ) : (
                                                row[key]
                                            )}
                                        </td>
                                    ))}
                                    <td className="row-actions">
                                        <button type="button" aria-label="Editar resultado" onClick={() => onCrud("standing", "edit", row)}>
                                            <FaEdit />
                                        </button>
                                        <button type="button" aria-label="Eliminar resultado" onClick={() => onCrud("standing", "delete", row)}>
                                            <FaRegTrashAlt />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="matches-manager">
                <div className="panel-heading panel-heading--compact">
                    <div>
                        <p className="section-kicker">Historial</p>
                        <h2>Partidos del torneo</h2>
                    </div>
                    <button type="button" className="tournament-action" onClick={() => onCrud("match", "create")}>
                        <FaPlus /> Partido
                    </button>
                </div>
                <div className="history-list">
                    {sportMatches.map((match) => {
                        const teamA = getTeam(teams, match.team_a);
                        const teamB = getTeam(teams, match.team_b);
                        const score = match.status === "finished" ? `${match.score_a} - ${match.score_b}` : "Programado";
                        return (
                            <div key={match.match_id} className="history-list__item history-list__item--actions">
                                <span>{formatDate(match.date)}</span>
                                <strong>
                                    {teamA?.team_name || "Pendiente"} vs {teamB?.team_name || "Pendiente"}
                                </strong>
                                <small>
                                    {match.round} · {score}
                                </small>
                                <div className="row-actions">
                                    <button type="button" aria-label="Editar partido" onClick={() => onCrud("match", "edit", match)}>
                                        <FaEdit />
                                    </button>
                                    <button type="button" aria-label="Eliminar partido" onClick={() => onCrud("match", "delete", match)}>
                                        <FaRegTrashAlt />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function TeamHistoryModal({ standing, teams, matches, onClose }) {
    if (!standing) return null;

    const team = getTeam(teams, standing.team_id);
    const teamMatches = matches.filter((match) => match.team_a === standing.team_id || match.team_b === standing.team_id);

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <article className="tournament-modal team-modal" onClick={stopModalPropagation}>
                <button type="button" className="modal-close" aria-label="Cerrar historial" onClick={onClose}>
                    <FaTimes />
                </button>
                <div className="team-modal__hero">
                    <span className="team-modal__logo" style={{ background: team?.primary_color || "#6CA300" }}>
                        {team?.team_name?.slice(0, 2).toUpperCase() || "CW"}
                    </span>
                    <div>
                        <p className="section-kicker">Historial del equipo</p>
                        <h2>{team?.team_name || standing.team_id}</h2>
                        <span>
                            {team?.university} · {team?.city}
                        </span>
                    </div>
                </div>

                <div className="team-stats-grid">
                    <strong>
                        Posición final <span>{standing.position}</span>
                    </strong>
                    <strong>
                        Partidos jugados <span>{standing.played}</span>
                    </strong>
                    <strong>
                        Victorias <span>{standing.wins}</span>
                    </strong>
                    <strong>
                        Empates <span>{standing.draws || "N/A"}</span>
                    </strong>
                    <strong>
                        Derrotas <span>{standing.losses}</span>
                    </strong>
                    <strong>
                        Deporte <span>{getSportLabel(standing.sport)}</span>
                    </strong>
                </div>

                <div className="history-list">
                    <h3>Partidos del torneo</h3>
                    {teamMatches.map((match) => {
                        const isTeamA = match.team_a === standing.team_id;
                        const rival = getTeam(teams, isTeamA ? match.team_b : match.team_a);
                        const ownScore = isTeamA ? match.score_a : match.score_b;
                        const rivalScore = isTeamA ? match.score_b : match.score_a;

                        return (
                            <div key={match.match_id} className="history-list__item">
                                <span>{formatDate(match.date)}</span>
                                <strong>{rival?.team_name || "Rival pendiente"}</strong>
                                <small>
                                    {match.round} · {match.status === "finished" ? `${ownScore} - ${rivalScore}` : "Programado"}
                                </small>
                            </div>
                        );
                    })}
                </div>
            </article>
        </div>
    );
}

function PhotosGallery({ sport, photos, tournaments, onCrud }) {
    const rows = photos.filter((photo) => photo.sport === sport);

    return (
        <section className="tournament-panel" aria-label="Fotos">
            <div className="panel-heading">
                <div>
                    <p className="section-kicker">Galería</p>
                    <h2>Fotos del torneo</h2>
                </div>
                <button type="button" className="tournament-action" onClick={() => onCrud("photo", "create")}>
                    <FaPlus /> Foto
                </button>
            </div>

            {rows.length === 0 ? (
                <p className="empty-state">Aún no hay fotos disponibles para este torneo.</p>
            ) : (
                <div className="photo-grid">
                    {rows.map((photo, index) => {
                        const tournament = tournaments.find((item) => item.tournament_id === photo.tournament_id);
                        return (
                            <article key={photo.photo_id} className="photo-card">
                                <img src={getPhotoImage(photo, index)} alt={photo.title} />
                                <div className="photo-card__body">
                                    <SportBadge sport={photo.sport} />
                                    <h3>{photo.title}</h3>
                                    <p>{photo.description}</p>
                                    <span>
                                        {formatDate(photo.date)} · {tournament?.tournament_name || photo.tournament_id}
                                    </span>
                                    <div className="card-actions">
                                        <button type="button" onClick={() => onCrud("photo", "edit", photo)}>
                                            <FaEdit /> Editar
                                        </button>
                                        <button type="button" onClick={() => onCrud("photo", "delete", photo)}>
                                            <FaRegTrashAlt /> Eliminar
                                        </button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function UpcomingTournaments({ sport, upcoming, matches, teams, onMatchupsOpen, onTeamsManage, onCrud }) {
    const rows = upcoming.filter((item) => item.sport === sport);

    return (
        <section className="tournament-panel" aria-label="Próximos torneos">
            <div className="panel-heading">
                <div>
                    <p className="section-kicker">Agenda deportiva</p>
                    <h2>Próximos torneos</h2>
                </div>
                <button type="button" className="tournament-action" onClick={() => onCrud("upcoming", "create")}>
                    <FaPlus /> Torneo
                </button>
            </div>

            <div className="upcoming-grid">
                {rows.map((item) => {
                    const assignedTeams = item.registered_teams === "Pendiente de asignar" ? [] : item.registered_teams.split(";").map((team) => team.trim());
                    const scheduledMatches = matches.filter((match) => match.sport === sport && match.status !== "finished" && match.tournament_id === item.upcoming_id);

                    return (
                        <article key={item.upcoming_id} className="upcoming-card">
                            <img src={getUpcomingImage(item, sport)} alt={item.tournament_name} />
                            <div>
                                <SportBadge sport={sport} />
                                <h3>{item.tournament_name}</h3>
                                <p>
                                    {formatDate(item.date)} · {item.location}
                                </p>
                                <strong>{getStatusLabel(item.status)}</strong>
                            </div>

                            <div className="team-chip-list">
                                {assignedTeams.length > 0 ? (
                                    assignedTeams.map((team) => (
                                        <button key={team} type="button" onClick={() => onMatchupsOpen({ item, selectedTeam: team, scheduledMatches, teams })}>
                                            {team}
                                        </button>
                                    ))
                                ) : (
                                    <span>Pendiente de asignar</span>
                                )}
                            </div>

                            <div className="card-actions">
                                <button type="button" onClick={() => onTeamsManage(item)}>
                                    <FaUsers /> Equipos
                                </button>
                                <button type="button" onClick={() => onMatchupsOpen({ item, scheduledMatches, teams })}>
                                    <FaTrophy /> Ver enfrentamientos
                                </button>
                                <button type="button" onClick={() => onCrud("upcoming", "edit", item)}>
                                    <FaEdit /> Editar
                                </button>
                                <button type="button" onClick={() => onCrud("upcoming", "delete", item)}>
                                    <FaRegTrashAlt /> Eliminar
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}

function TournamentTeamsModal({ tournament, teams, onClose, onSave }) {
    const availableTeams = teams.filter((team) => team.sport === tournament.sport);
    const initialSelectedTeams = tournament.registered_teams === "Pendiente de asignar" ? [] : tournament.registered_teams.split(";").map((team) => team.trim());
    const [selectedTeams, setSelectedTeams] = useState(initialSelectedTeams);
    const [pendingAction, setPendingAction] = useState(null);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);

    function toggleTeam(teamName) {
        setSelectedTeams((current) => (current.includes(teamName) ? current.filter((name) => name !== teamName) : [...current, teamName]));
    }

    function requestSave() {
        setPendingAction({ type: "upcoming-teams", action: "edit" });
        setPassword("");
        setPasswordError(false);
    }

    async function authorizeSave() {
        if (!(await verifyCrudPassword(password))) {
            setPasswordError(true);
            return;
        }

        onSave({
            ...tournament,
            registered_teams: selectedTeams.length > 0 ? selectedTeams.join("; ") : "Pendiente de asignar",
        });
        setPendingAction(null);
        setPassword("");
        setPasswordError(false);
        onClose();
    }

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}>
                <article className="tournament-modal teams-modal" onClick={stopModalPropagation}>
                    <button type="button" className="modal-close" aria-label="Cerrar equipos" onClick={onClose}>
                        <FaTimes />
                    </button>
                    <p className="section-kicker">Equipos participantes</p>
                    <h2>{tournament.tournament_name}</h2>
                    <p>Selecciona equipos existentes de la base de datos para este torneo.</p>

                    <div className="teams-selector">
                        {availableTeams.map((team) => (
                            <label key={team.team_id} className={selectedTeams.includes(team.team_name) ? "team-select-card team-select-card--active" : "team-select-card"}>
                                <input type="checkbox" checked={selectedTeams.includes(team.team_name)} onChange={() => toggleTeam(team.team_name)} />
                                <span className="team-dot" style={{ background: team.primary_color }} />
                                <strong>{team.team_name}</strong>
                                <small>{team.university}</small>
                            </label>
                        ))}
                    </div>

                    <button type="button" className="tournament-action" onClick={requestSave}>
                        <FaUsers /> Guardar equipos
                    </button>
                </article>
            </div>
            <PasswordValidationModal
                pendingAction={pendingAction}
                password={password}
                error={passwordError}
                onPasswordChange={setPassword}
                onConfirm={authorizeSave}
                onClose={() => {
                    setPendingAction(null);
                    setPassword("");
                    setPasswordError(false);
                }}
            />
        </>
    );
}

function MatchupsModal({ payload, onClose, onCreateMatch, onUpdateMatch, onDeleteMatch }) {
    const participantOptions = getParticipantOptions(payload.item, payload.teams);
    const selectedOption = participantOptions.find((team) => team.label === payload.selectedTeam);
    const defaultTeamA = selectedOption?.id || participantOptions[0]?.id || "";
    const defaultTeamB = participantOptions.find((team) => team.id !== defaultTeamA)?.id || "";
    const [teamA, setTeamA] = useState(defaultTeamA);
    const [teamB, setTeamB] = useState(defaultTeamB);
    const [rows, setRows] = useState(payload.scheduledMatches || []);
    const [editingMatch, setEditingMatch] = useState(null);
    const [protectedAction, setProtectedAction] = useState(null);
    const [matchupPassword, setMatchupPassword] = useState("");
    const [matchupPasswordError, setMatchupPasswordError] = useState(false);
    const canSaveMatch = teamA && teamB && teamA !== teamB;

    function buildMatchup(matchId = makeId("MAT-UP")) {
        return {
            match_id: matchId,
            tournament_id: payload.item.upcoming_id,
            sport: payload.item.sport,
            date: payload.item.date,
            team_a: teamA,
            team_b: teamB,
            score_a: "",
            score_b: "",
            winner: "",
            status: "scheduled",
            round: "Programado",
        };
    }

    function requestProtectedAction(action, match = null) {
        if (action === "create" && !canSaveMatch) return;
        setProtectedAction({ action, match });
        setMatchupPassword("");
        setMatchupPasswordError(false);
    }

    async function authorizeMatchupAction() {
        if (!(await verifyCrudPassword(matchupPassword))) {
            setMatchupPasswordError(true);
            return;
        }

        if (protectedAction.action === "create") {
            const nextMatch = buildMatchup();
            setRows((current) => [nextMatch, ...current]);
            onCreateMatch(nextMatch);
        }

        if (protectedAction.action === "edit") {
            startMatchupEdit(protectedAction.match);
        }

        if (protectedAction.action === "update" && editingMatch) {
            const editedMatch = buildMatchup(editingMatch.match_id);
            setRows((current) => updateCrudItem(current, "match_id", editedMatch));
            onUpdateMatch(editedMatch);
            setEditingMatch(null);
        }

        if (protectedAction.action === "delete") {
            setRows((current) => deleteCrudItem(current, "match_id", protectedAction.match.match_id));
            onDeleteMatch(protectedAction.match.match_id);
            if (editingMatch?.match_id === protectedAction.match.match_id) {
                setEditingMatch(null);
            }
        }

        setProtectedAction(null);
        setMatchupPassword("");
        setMatchupPasswordError(false);
    }

    function updateCurrentMatchup() {
        if (!editingMatch || !canSaveMatch) return;
        const editedMatch = buildMatchup(editingMatch.match_id);
        setRows((current) => updateCrudItem(current, "match_id", editedMatch));
        onUpdateMatch(editedMatch);
        setEditingMatch(null);
    }

    function startMatchupEdit(match) {
        setEditingMatch(match);
        setTeamA(match.team_a);
        setTeamB(match.team_b);
    }

    function cancelMatchupEdit() {
        setEditingMatch(null);
        setTeamA(defaultTeamA);
        setTeamB(defaultTeamB);
    }

    return (
        <>
            <div className="modal-backdrop" onClick={onClose}>
                <article className="tournament-modal matchups-modal" onClick={stopModalPropagation}>
                    <button type="button" className="modal-close" aria-label="Cerrar enfrentamientos" onClick={onClose}>
                        <FaTimes />
                    </button>
                    <p className="section-kicker">Enfrentamientos</p>
                    <h2>{payload.item.tournament_name}</h2>
                    {payload.selectedTeam && <p>Equipo seleccionado: {payload.selectedTeam}</p>}

                    <div className="matchup-builder" aria-label="Organizar enfrentamiento">
                        <label>
                            Equipo 1
                            <select value={teamA} onChange={(event) => setTeamA(event.target.value)}>
                                {participantOptions.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <span>VS</span>
                        <label>
                            Equipo 2
                            <select value={teamB} onChange={(event) => setTeamB(event.target.value)}>
                                {participantOptions.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            className="tournament-action"
                            disabled={!canSaveMatch}
                            onClick={editingMatch ? updateCurrentMatchup : () => requestProtectedAction("create")}
                        >
                            <FaPlus /> {editingMatch ? "Guardar cruce" : "Organizar"}
                        </button>
                    </div>

                    {editingMatch && (
                        <button type="button" className="matchup-cancel" onClick={cancelMatchupEdit}>
                            Cancelar edición
                        </button>
                    )}

                    {teamA === teamB && <p className="modal-error">Selecciona dos equipos diferentes para organizar el enfrentamiento.</p>}

                    {rows.length === 0 ? (
                        <p className="empty-state">Los enfrentamientos aún están pendientes de asignar.</p>
                    ) : (
                        <div className="history-list">
                            {rows.map((match) => {
                                return (
                                    <div key={match.match_id} className="history-list__item history-list__item--actions">
                                        <span>{formatDate(match.date)}</span>
                                        <strong>
                                            {getDisplayTeamName(payload.teams, match.team_a)} vs {getDisplayTeamName(payload.teams, match.team_b)}
                                        </strong>
                                        <small>{match.round}</small>
                                        <div className="row-actions">
                                            <button type="button" aria-label="Editar enfrentamiento" onClick={() => requestProtectedAction("edit", match)}>
                                                <FaEdit />
                                            </button>
                                            <button type="button" aria-label="Eliminar enfrentamiento" onClick={() => requestProtectedAction("delete", match)}>
                                                <FaRegTrashAlt />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </article>
            </div>
            <PasswordValidationModal
                pendingAction={protectedAction}
                password={matchupPassword}
                error={matchupPasswordError}
                onPasswordChange={setMatchupPassword}
                onConfirm={authorizeMatchupAction}
                onClose={() => {
                    setProtectedAction(null);
                    setMatchupPassword("");
                    setMatchupPasswordError(false);
                }}
            />
        </>
    );
}

function PasswordValidationModal({ pendingAction, password, error, onPasswordChange, onConfirm, onClose }) {
    if (!pendingAction) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <article className="tournament-modal password-modal" onClick={stopModalPropagation}>
                <button type="button" className="modal-close" aria-label="Cerrar validación" onClick={onClose}>
                    <FaTimes />
                </button>
                <p className="section-kicker">Edición protegida</p>
                <h2>Ingresa la palabra clave</h2>
                <input type="password" value={password} placeholder="Palabra clave" onChange={(event) => onPasswordChange(event.target.value)} autoFocus />
                {error && <p className="modal-error">Palabra clave incorrecta. No tienes permisos para modificar esta información.</p>}
                <button type="button" className="tournament-action" onClick={onConfirm}>
                    Validar permiso
                </button>
            </article>
        </div>
    );
}

function TournamentCRUDModal({ crudAction, formValues, teams, activeSport, onChange, onSubmit, onClose }) {
    if (!crudAction?.authorized) return null;

    const isDelete = crudAction.action === "delete";
    const title = getModalTitle(crudAction.action);
    const selectedPhotoPreview = formValues.image_url?.startsWith("data:image/") ? formValues.image_url : null;

    function handleImageFileChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            onChange("image_url", reader.result);
            onChange("image_file_name", file.name);
        };
        reader.readAsDataURL(file);
    }

    const fieldSets = {
        sport: [
            ["label", "Nombre de disciplina"],
            ["accent", "Color activo"],
        ],
        standing: [
            ["team_id", "Equipo"],
            ["position", "Posición"],
            ["played", "PJ"],
            ["wins", "PG"],
            ["draws", "PE"],
            ["losses", "PP"],
            ["points_for", "PF"],
            ["points_against", "PC"],
            ["point_difference", "DIF puntos"],
            ["sets_won", "SW"],
            ["sets_lost", "SL"],
            ["set_difference", "DIF sets"],
            ["goals_for", "GF"],
            ["goals_against", "GC"],
            ["goal_difference", "DIF goles"],
            ["points", "PTS"],
            ["tournament_points", "PTS torneo"],
        ],
        photo: [
            ["title", "Título"],
            ["description", "Descripción"],
            ["image_file", "Imagen del torneo"],
            ["date", "Fecha"],
            ["tournament_id", "Torneo"],
        ],
        upcoming: [
            ["tournament_name", "Nombre del torneo"],
            ["image_file", "Imagen del torneo"],
            ["date", "Fecha"],
            ["location", "Lugar"],
            ["registered_teams", "Equipos participantes"],
            ["status", "Estado"],
        ],
        match: [
            ["team_a", "Equipo A"],
            ["team_b", "Equipo B"],
            ["date", "Fecha"],
            ["score_a", "Marcador A"],
            ["score_b", "Marcador B"],
            ["winner", "Ganador"],
            ["status", "Estado"],
            ["round", "Ronda"],
        ],
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <article className="tournament-modal crud-modal" onClick={stopModalPropagation}>
                <button type="button" className="modal-close" aria-label="Cerrar formulario" onClick={onClose}>
                    <FaTimes />
                </button>
                <p className="section-kicker">{crudAction.type}</p>
                <h2>{title}</h2>

                {isDelete ? (
                    <p>Esta acción eliminará el registro seleccionado de la simulación local.</p>
                ) : (
                    <form className="crud-form" onSubmit={onSubmit}>
                        {fieldSets[crudAction.type].map(([name, label]) => {
                            if ((crudAction.type === "standing" && name === "team_id") || (crudAction.type === "match" && ["team_a", "team_b", "winner"].includes(name))) {
                                return (
                                    <label key={name}>
                                        {label}
                                        <select value={formValues[name] || ""} onChange={(event) => onChange(name, event.target.value)}>
                                            {name === "winner" && <option value="">Empate o pendiente</option>}
                                            {teams
                                                .filter((team) => team.sport === activeSport)
                                                .map((team) => (
                                                    <option key={team.team_id} value={team.team_id}>
                                                        {team.team_name}
                                                    </option>
                                                ))}
                                        </select>
                                    </label>
                                );
                            }

                            if ((crudAction.type === "photo" || crudAction.type === "upcoming") && name === "image_file") {
                                return (
                                    <label key={name} className="file-picker">
                                        {label}
                                        <input type="file" accept="image/*" onChange={handleImageFileChange} />
                                        <span>{formValues.image_file_name || "Selecciona una imagen desde tu equipo"}</span>
                                        {selectedPhotoPreview && <img src={selectedPhotoPreview} alt="Previsualización de la foto seleccionada" />}
                                    </label>
                                );
                            }

                            return (
                                <label key={name}>
                                    {label}
                                    <input type={name === "date" ? "date" : "text"} value={formValues[name] ?? ""} onChange={(event) => onChange(name, event.target.value)} />
                                </label>
                            );
                        })}
                    </form>
                )}

                <button type="button" className="tournament-action tournament-action--danger" onClick={isDelete ? onSubmit : onSubmit}>
                    {isDelete ? "Eliminar" : "Guardar cambios"}
                </button>
            </article>
        </div>
    );
}

function TournamentSection() {
    const [sports, setSports] = useState(baseSports);
    const [teams] = useState(initialData.teams);
    const [tournaments] = useState(initialData.tournaments);
    const [standings, setStandings] = useState(initialData.standings);
    const [matches, setMatches] = useState(initialData.matches);
    const [photos, setPhotos] = useState(initialData.photos);
    const [upcoming, setUpcoming] = useState(initialData.upcoming);
    const [activeSport, setActiveSport] = useState("volleyball");
    const [activeTab, setActiveTab] = useState("results");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [teamModal, setTeamModal] = useState(null);
    const [matchupsModal, setMatchupsModal] = useState(null);
    const [teamsModal, setTeamsModal] = useState(null);
    const [pendingAction, setPendingAction] = useState(null);
    const [crudAction, setCrudAction] = useState(null);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState(false);
    const [formValues, setFormValues] = useState({});

    const activeSportConfig = sports.find((sport) => sport.id === activeSport) || sports[0];
    const lastTournament = useMemo(() => getLastTournament(tournaments, activeSport), [tournaments, activeSport]);

    function startCrud(type, action, item = null) {
        const defaults = {
            sport: { id: `custom-${Date.now().toString(36)}`, label: "", accent: "#F59E0B" },
            standing: {
                standing_id: makeId("STD"),
                tournament_id: lastTournament?.tournament_id || "",
                sport: activeSport,
                team_id: teams.find((team) => team.sport === activeSport)?.team_id || "",
                position: standings.filter((standing) => standing.sport === activeSport).length + 1,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
            },
            photo: {
                photo_id: makeId("PHT"),
                tournament_id: lastTournament?.tournament_id || "",
                sport: activeSport,
                title: "",
                description: "",
                image_url: "",
                image_file_name: "",
                date: new Date().toISOString().slice(0, 10),
            },
            upcoming: {
                upcoming_id: makeId("UP"),
                tournament_name: "",
                sport: activeSport,
                date: "",
                location: "",
                registered_teams: "Pendiente de asignar",
                image_url: "",
                image_file_name: "",
                status: "pending",
            },
            match: {
                match_id: makeId("MAT"),
                tournament_id: lastTournament?.tournament_id || "",
                sport: activeSport,
                date: "",
                team_a: teams.find((team) => team.sport === activeSport)?.team_id || "",
                team_b: teams.filter((team) => team.sport === activeSport)[1]?.team_id || "",
                score_a: "",
                score_b: "",
                winner: "",
                status: "scheduled",
                round: "Fecha por asignar",
            },
        };

        setFormValues(item ? { ...item } : defaults[type]);
        setPendingAction({ type, action, item });
        setPassword("");
        setPasswordError(false);
    }

    async function authorizeCrud() {
        if (!(await verifyCrudPassword(password))) {
            setPasswordError(true);
            return;
        }
        setCrudAction({ ...pendingAction, authorized: true });
        setPendingAction(null);
    }

    function closeCrud() {
        setCrudAction(null);
        setPendingAction(null);
        setPassword("");
        setPasswordError(false);
    }

    function updateFormValue(name, value) {
        setFormValues((current) => ({ ...current, [name]: value }));
    }

    function submitCrud(event) {
        event?.preventDefault?.();
        const numberCleanedValues = Object.entries(formValues).reduce((next, [key, value]) => {
            const shouldBeNumber = typeof initialData.standings[0]?.[key] === "number";
            next[key] = shouldBeNumber && value !== "" ? Number(value) : value;
            return next;
        }, {});

        if (crudAction.type === "sport") {
            if (crudAction.action === "delete") {
                setSports((current) => current.filter((sport) => sport.id !== formValues.id));
            } else if (crudAction.action === "edit") {
                setSports((current) => current.map((sport) => (sport.id === formValues.id ? { ...sport, ...numberCleanedValues, icon: sport.icon } : sport)));
            } else {
                setSports((current) => [{ ...numberCleanedValues, id: numberCleanedValues.label.toLowerCase().replace(/\s+/g, "-"), icon: FaTrophy }, ...current]);
            }
        }

        if (crudAction.type === "standing") {
            if (crudAction.action === "delete") setStandings((current) => deleteCrudItem(current, "standing_id", formValues.standing_id));
            if (crudAction.action === "edit") setStandings((current) => updateCrudItem(current, "standing_id", numberCleanedValues));
            if (crudAction.action === "create") setStandings((current) => createCrudItem(current, numberCleanedValues));
        }

        if (crudAction.type === "photo") {
            if (crudAction.action === "delete") setPhotos((current) => deleteCrudItem(current, "photo_id", formValues.photo_id));
            if (crudAction.action === "edit") setPhotos((current) => updateCrudItem(current, "photo_id", numberCleanedValues));
            if (crudAction.action === "create") setPhotos((current) => createCrudItem(current, numberCleanedValues));
        }

        if (crudAction.type === "upcoming") {
            if (crudAction.action === "delete") setUpcoming((current) => deleteCrudItem(current, "upcoming_id", formValues.upcoming_id));
            if (crudAction.action === "edit") setUpcoming((current) => updateCrudItem(current, "upcoming_id", numberCleanedValues));
            if (crudAction.action === "create") setUpcoming((current) => createCrudItem(current, numberCleanedValues));
        }

        if (crudAction.type === "match") {
            if (crudAction.action === "delete") setMatches((current) => deleteCrudItem(current, "match_id", formValues.match_id));
            if (crudAction.action === "edit") setMatches((current) => updateCrudItem(current, "match_id", numberCleanedValues));
            if (crudAction.action === "create") setMatches((current) => createCrudItem(current, numberCleanedValues));
        }

        closeCrud();
    }

    return (
        <div id="torneos" className="tournament-page">
            <section className="tournament-hero">
                <div>
                    <p className="section-kicker">Coding With Friends Sports</p>
                    <h1>Torneos universitarios</h1>
                    <p>Gestión de torneos de voleibol, baloncesto, fútbol y fútbol sala con datos CSV simulados para el contexto universitario de Medellín y Antioquia.</p>
                </div>
                <img src={sportImages[activeSport]} alt="" />
            </section>

            <section className={`tournament-shell ${isSidebarCollapsed ? "tournament-shell--collapsed" : ""}`}>
                <SportsSidebar
                    sports={sports}
                    activeSport={activeSport}
                    teams={teams}
                    isCollapsed={isSidebarCollapsed}
                    onSportChange={setActiveSport}
                    onCrud={startCrud}
                    onToggle={() => setIsSidebarCollapsed((current) => !current)}
                />

                <div className="tournament-content" style={{ "--active-sport-color": activeSportConfig.accent }}>
                    <div className="tournament-content__header">
                        <div>
                            <p className="section-kicker">Disciplina activa</p>
                            <h2>{activeSportConfig.label}</h2>
                        </div>
                        <SportBadge sport={activeSport} />
                    </div>

                    <TournamentTabs activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="tournament-view">
                        {activeTab === "results" && (
                            <ResultsTable
                                sport={activeSport}
                                standings={standings}
                                teams={teams}
                                tournament={lastTournament}
                                matches={matches}
                                onTeamSelect={setTeamModal}
                                onCrud={startCrud}
                            />
                        )}
                        {activeTab === "photos" && <PhotosGallery sport={activeSport} photos={photos} tournaments={tournaments} onCrud={startCrud} />}
                        {activeTab === "upcoming" && (
                            <UpcomingTournaments
                                sport={activeSport}
                                upcoming={upcoming}
                                matches={matches}
                                teams={teams}
                                onMatchupsOpen={setMatchupsModal}
                                onTeamsManage={setTeamsModal}
                                onCrud={startCrud}
                            />
                        )}
                    </div>
                </div>
            </section>

            <TeamHistoryModal standing={teamModal} teams={teams} matches={matches} onClose={() => setTeamModal(null)} />
            {teamsModal && (
                <TournamentTeamsModal
                    tournament={teamsModal}
                    teams={teams}
                    onClose={() => setTeamsModal(null)}
                    onSave={(updatedTournament) => setUpcoming((current) => updateCrudItem(current, "upcoming_id", updatedTournament))}
                />
            )}
            {matchupsModal && (
                <MatchupsModal
                    key={matchupsModal.item.upcoming_id}
                    payload={matchupsModal}
                    onClose={() => setMatchupsModal(null)}
                    onCreateMatch={(match) => setMatches((current) => createCrudItem(current, match))}
                    onUpdateMatch={(match) => setMatches((current) => updateCrudItem(current, "match_id", match))}
                    onDeleteMatch={(matchId) => setMatches((current) => deleteCrudItem(current, "match_id", matchId))}
                />
            )}
            <PasswordValidationModal
                pendingAction={pendingAction}
                password={password}
                error={passwordError}
                onPasswordChange={setPassword}
                onConfirm={authorizeCrud}
                onClose={closeCrud}
            />
            <TournamentCRUDModal
                crudAction={crudAction}
                formValues={formValues}
                teams={teams}
                activeSport={activeSport}
                onChange={updateFormValue}
                onSubmit={submitCrud}
                onClose={closeCrud}
            />
        </div>
    );
}

export default TournamentSection;
