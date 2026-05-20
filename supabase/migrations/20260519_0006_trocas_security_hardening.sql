-- Pin search_path on trigger function (Supabase advisor: function_search_path_mutable)
alter function public.trocas_set_updated_at() set search_path = '';

-- trocas_handle_new_user is invoked only via trigger; revoke direct callability
-- (Supabase advisor: anon/authenticated_security_definer_function_executable)
revoke execute on function public.trocas_handle_new_user() from public, anon, authenticated;
