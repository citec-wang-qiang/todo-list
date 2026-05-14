use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use std::thread;

use tauri::{Emitter, Manager};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_sql::{Migration, MigrationKind};

struct ReminderEntry {
    title: String,
    reminder_at_ms: i64,
}

struct ReminderState {
    reminders: Mutex<HashMap<String, ReminderEntry>>,
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_db_path(app: tauri::AppHandle) -> Result<String, String> {
    let db_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    Ok(db_dir.join("todo.db").to_string_lossy().to_string())
}

#[tauri::command]
fn copy_file(src: String, dest: String) -> Result<(), String> {
    std::fs::copy(&src, &dest).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn schedule_reminder(
    state: tauri::State<'_, ReminderState>,
    task_id: String,
    title: String,
    reminder_at_ms: i64,
) {
    state.reminders.lock().unwrap().insert(
        task_id,
        ReminderEntry {
            title,
            reminder_at_ms,
        },
    );
}

#[tauri::command]
fn cancel_reminder(state: tauri::State<'_, ReminderState>, task_id: String) {
    state.reminders.lock().unwrap().remove(&task_id);
}

#[tauri::command]
fn init_reminders(
    state: tauri::State<'_, ReminderState>,
    reminders: Vec<(String, String, i64)>,
) {
    let mut map = state.reminders.lock().unwrap();
    map.clear();
    for (task_id, title, reminder_at_ms) in reminders {
        map.insert(
            task_id,
            ReminderEntry {
                title,
                reminder_at_ms,
            },
        );
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: include_str!("../migrations/001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add sort_order column to tasks",
            sql: include_str!("../migrations/002_add_sort_order.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add reminder_at column to tasks",
            sql: include_str!("../migrations/003_add_reminders.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:todo.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .manage(ReminderState {
            reminders: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            write_file,
            read_file,
            get_db_path,
            copy_file,
            schedule_reminder,
            cancel_reminder,
            init_reminders,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            let handle = app.handle().clone();
            thread::spawn(move || {
                loop {
                    thread::sleep(Duration::from_secs(30));
                    let now_ms = SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap()
                        .as_millis() as i64;

                    let state = handle.state::<ReminderState>();
                    let mut due: Vec<(String, String)> = Vec::new();
                    {
                        let reminders = state.reminders.lock().unwrap();
                        for (task_id, entry) in reminders.iter() {
                            if entry.reminder_at_ms <= now_ms {
                                due.push((task_id.clone(), entry.title.clone()));
                            }
                        }
                    }

                    for (task_id, title) in &due {
                        let _ = handle
                            .notification()
                            .builder()
                            .title("Todo List")
                            .body(format!("Reminder: {}", title))
                            .show();

                        let _ = handle.emit("reminder-triggered", task_id);

                        state.reminders.lock().unwrap().remove(task_id);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
