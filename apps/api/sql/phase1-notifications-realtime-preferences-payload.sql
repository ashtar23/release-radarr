create or replace function public.notify_notification_preferences_change()
returns trigger
language plpgsql
as $$
begin
  perform pg_notify(
    'notifications_realtime',
    json_build_object(
      'userId', new.user_id::text,
      'scope', 'preferences',
      'preferences', json_build_object(
        'channels', json_build_object(
          'inApp', new.in_app_enabled,
          'push', new.push_enabled
        ),
        'events', json_build_object(
          'releaseApproaching', new.release_approaching_enabled,
          'releaseDateChanged', new.release_date_changed_enabled
        ),
        'timingPresets', new.timing_presets,
        'updatedAt', to_char(new.updated_at at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
    )::text
  );

  return null;
end;
$$;