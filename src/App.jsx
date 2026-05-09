import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiEdit3,
  FiFlag,
  FiMoon,
  FiPlus,
  FiSearch,
  FiSun,
  FiTrash2,
  FiX,
  FiZap,
} from "react-icons/fi";
import "./App.css";
import bgVideo from "./assets/bg.mp4";

const appTimeZone = "Asia/Karachi";
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: appTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const initialTasks = [
  {
    id: crypto.randomUUID(),
    title: "Finish React todo app",
    priority: "high",
    category: "Work",
    dueDate: today,
    completed: false,
    createdAt: Date.now() - 2000,
  },
  {
    id: crypto.randomUUID(),
    title: "Review today's important tasks",
    priority: "medium",
    category: "Personal",
    dueDate: "",
    completed: true,
    createdAt: Date.now() - 1000,
  },
];

const filters = ["all", "active", "completed"];
const priorities = ["low", "medium", "high"];
const priorityLabels = {
  low: "Easy",
  medium: "Important",
  high: "Urgent",
};
const priorityRank = { high: 0, medium: 1, low: 2 };
const sortOptions = [
  { value: "priority", label: "Priority" },
  { value: "dueDate", label: "Due date" },
  { value: "newest", label: "Newest" },
];
const quickTasks = [
  { title: "Plan tomorrow", priority: "medium", category: "Planning" },
  { title: "Drink water", priority: "low", category: "Health" },
  { title: "Send important update", priority: "high", category: "Work" },
];
const datePresets = [
  { label: "Today", offset: 0 },
  { label: "Tomorrow", offset: 1 },
  { label: "Next Week", offset: 7 },
];

function getStoredTasks() {
  try {
    const savedTasks = localStorage.getItem("todo.tasks");
    return savedTasks ? JSON.parse(savedTasks) : initialTasks;
  } catch {
    return initialTasks;
  }
}

function getStoredTheme() {
  try {
    return localStorage.getItem("todo.theme") || "dark";
  } catch {
    return "dark";
  }
}

function getDateFromOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: appTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatLiveDate(date) {
  return new Intl.DateTimeFormat("en", {
    timeZone: appTimeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatLiveTime(date) {
  return new Intl.DateTimeFormat("en", {
    timeZone: appTimeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSelectedDate(dateValue) {
  if (!dateValue) return "No date selected";

  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateValue}T00:00:00`));
}

function App() {
  const [tasks, setTasks] = useState(getStoredTasks);
  const [theme, setTheme] = useState(getStoredTheme);
  const [liveNow, setLiveNow] = useState(new Date());
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("Personal");
  const [dueDate, setDueDate] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    localStorage.setItem("todo.tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("todo.theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const timerId = window.setInterval(() => setLiveNow(new Date()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const active = total - completed;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const overdue = tasks.filter((task) => isOverdue(task)).length;
    const dueToday = tasks.filter((task) => !task.completed && task.dueDate === today).length;

    return { total, completed, active, percent, overdue, dueToday };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesQuery =
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          task.category.toLowerCase().includes(query.toLowerCase());
        const matchesFilter =
          filter === "all" ||
          (filter === "active" && !task.completed) ||
          (filter === "completed" && task.completed);

        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);

        if (sortBy === "newest") return (b.createdAt || 0) - (a.createdAt || 0);
        if (sortBy === "dueDate") {
          const aDue = a.dueDate || "9999-12-31";
          const bDue = b.dueDate || "9999-12-31";
          if (aDue !== bDue) return aDue.localeCompare(bDue);
        }

        return priorityRank[a.priority] - priorityRank[b.priority];
      });
  }, [filter, query, sortBy, tasks]);

  function createTask(taskTitle, taskPriority = priority, taskCategory = category, taskDueDate = dueDate) {
    const cleanTitle = taskTitle.trim();

    if (!cleanTitle) return;

    setTasks((currentTasks) => [
      {
        id: crypto.randomUUID(),
        title: cleanTitle,
        priority: taskPriority,
        category: taskCategory.trim() || "General",
        dueDate: taskDueDate,
        completed: false,
        createdAt: Date.now(),
      },
      ...currentTasks,
    ]);
  }

  function addTask(event) {
    event.preventDefault();
    createTask(title);
    setTitle("");
    setPriority("medium");
    setCategory("Personal");
    setDueDate("");
  }

  function toggleTask(id) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }

  function deleteTask(id) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));
  }

  function clearCompleted() {
    setTasks((currentTasks) => currentTasks.filter((task) => !task.completed));
  }

  function completeDueToday() {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        !task.completed && task.dueDate === today ? { ...task, completed: true } : task
      )
    );
  }

  function startEditing(task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
  }

  function saveEdit() {
    const cleanTitle = editingTitle.trim();

    if (!cleanTitle) {
      setEditingId(null);
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === editingId ? { ...task, title: cleanTitle } : task
      )
    );
    setEditingId(null);
    setEditingTitle("");
  }

  function isOverdue(task) {
    if (!task.dueDate || task.completed) return false;
    return task.dueDate < today;
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <video className="background-video" autoPlay muted loop playsInline aria-hidden="true">
        <source src={bgVideo} type="video/mp4" />
      </video>
      <div className="video-overlay" aria-hidden="true" />

      <section className="workspace">
        <header className="app-header">
          <div>
           <p className="eyebrow text-8xl font-bold">
  Daily Planner
</p>
            <h1>Todo Studio</h1>
            <p className="subtitle">Plan, prioritize, and finish your day with clarity.</p>
          </div>

          <div className="progress-card" aria-label={`${stats.percent}% completed`}>
            <strong>{stats.percent}%</strong>
            <span>Complete</span>
          </div>

          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
          </button>
        </header>

        <form className="task-form" onSubmit={addTask}>
          <label className="search-field">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks or categories"
            />
          </label>

          <div className="form-grid">
            <input
              className="task-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a new task"
              aria-label="New task title"
            />

            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              aria-label="Priority"
            >
              {priorities.map((item) => (
                <option key={item} value={item}>
                  {priorityLabels[item]}
                </option>
              ))}
            </select>

            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Category"
              aria-label="Category"
            />

            <div className="calendar-box">
              <div className="date-stack">
                <label className="date-field">
                  <FiCalendar aria-hidden="true" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    aria-label="Due date"
                  />
                </label>
                <span className="selected-date">{formatSelectedDate(dueDate)}</span>
              </div>
              <div className="live-calendar" aria-label="Live calendar">
                <small>Pakistan Time</small>
                <span>{formatLiveDate(liveNow)}</span>
                <strong>{formatLiveTime(liveNow)}</strong>
              </div>
            </div>

            <button className="add-button" type="submit" aria-label="Add task">
              <FiPlus aria-hidden="true" />
              Add Task
            </button>
          </div>

          <div className="date-presets" aria-label="Quick due date">
            {datePresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={dueDate === getDateFromOffset(preset.offset) ? "selected" : ""}
                onClick={() => setDueDate(getDateFromOffset(preset.offset))}
              >
                <FiCalendar aria-hidden="true" />
                {preset.label}
              </button>
            ))}

            {dueDate && (
              <button className="ghost" type="button" onClick={() => setDueDate("")}>
                <FiX aria-hidden="true" />
                No Date
              </button>
            )}
          </div>

          <div className="quick-row" aria-label="Quick add tasks">
            {quickTasks.map((task) => (
              <button
                key={task.title}
                type="button"
                onClick={() => createTask(task.title, task.priority, task.category, today)}
              >
                <FiZap aria-hidden="true" />
                {task.title}
              </button>
            ))}
          </div>
        </form>

        <div className="toolbar">
          <div className="filter-group" aria-label="Task filters">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
              >
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          <div className="toolbar-actions">
            <label className="sort-field">
              <FiFlag aria-hidden="true" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort tasks"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button className="clear-button" type="button" onClick={clearCompleted}>
              Clear Completed
            </button>
          </div>
        </div>

        <section className="task-list" aria-label="Tasks">
          {filteredTasks.length ? (
            filteredTasks.map((task) => (
              <article
                className={`task-card ${task.completed ? "done" : ""}`}
                key={task.id}
              >
                <button
                  className={`check-button ${task.completed ? "checked" : ""}`}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.completed ? "Mark active" : "Mark complete"}
                >
                  {task.completed && <FiCheck aria-hidden="true" />}
                </button>

                <div className="task-content">
                  {editingId === task.id ? (
                    <input
                      className="edit-input"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") saveEdit();
                        if (event.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <h2>{task.title}</h2>
                  )}

                  <div className="meta-row">
                    <span className={`pill priority-${task.priority}`}>
                      {priorityLabels[task.priority]}
                    </span>
                    <span className="pill">{task.category}</span>
                    {task.dueDate && (
                      <span className={`pill ${isOverdue(task) ? "overdue" : ""}`}>
                        <FiCalendar aria-hidden="true" />
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>

                <div className="actions">
                  <button type="button" onClick={() => startEditing(task)} aria-label="Edit task">
                    <FiEdit3 aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => deleteTask(task.id)} aria-label="Delete task">
                    <FiTrash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <FiClock aria-hidden="true" />
              <h2>No tasks found</h2>
              <p>Add a task or adjust your filters to get back in motion.</p>
              {query && (
                <button type="button" onClick={() => setQuery("")}>
                  <FiX aria-hidden="true" />
                  Clear Search
                </button>
              )}
            </div>
          )}
        </section>
      </section>

      <aside className="stats-panel" aria-label="Task summary">
        <h2>Overview</h2>
        <div className="stat-card">
          <span>Total</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>
        <div className="stat-card">
          <span>Done</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className="stat-card alert">
          <span>Overdue</span>
          <strong>{stats.overdue}</strong>
        </div>

        <div className="progress-track">
          <div style={{ width: `${stats.percent}%` }} />
        </div>

        <div className="today-card">
          <div>
            <span>Due today</span>
            <strong>{stats.dueToday}</strong>
          </div>
          <button type="button" onClick={completeDueToday} disabled={!stats.dueToday}>
            Finish Today
          </button>
        </div>
      </aside>
    </main>
  );
}

export default App;
