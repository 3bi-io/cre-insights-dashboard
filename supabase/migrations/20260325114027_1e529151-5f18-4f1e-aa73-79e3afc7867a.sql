DROP FUNCTION IF EXISTS public.get_random_jobs(text, int, int, text, text, uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_random_jobs(
  _seed text,
  _limit int DEFAULT 50,
  _offset int DEFAULT 0,
  _search text DEFAULT '',
  _location text DEFAULT '',
  _client_id uuid DEFAULT NULL,
  _category_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid, title text, job_title text, job_summary text, job_description text,
  city text, state text, location text, salary_min numeric, salary_max numeric,
  salary_type text, job_type text, created_at timestamptz, dest_city text, dest_state text,
  organization_id uuid, client_id uuid, status text, is_hidden boolean,
  category_id uuid, updated_at timestamptz, user_id uuid,
  apply_url text, url text, experience_level text, remote_type text,
  total_count bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT jl.*
    FROM job_listings jl
    WHERE jl.status = 'active'
      AND jl.is_hidden = false
      AND (_search = '' OR jl.title ILIKE '%' || _search || '%' OR jl.job_title ILIKE '%' || _search || '%' OR jl.job_summary ILIKE '%' || _search || '%')
      AND (_location = '' OR jl.city ILIKE '%' || _location || '%' OR jl.state ILIKE '%' || _location || '%' OR jl.location ILIKE '%' || _location || '%')
      AND (_client_id IS NULL OR jl.client_id = _client_id)
      AND (_category_id IS NULL OR jl.category_id = _category_id)
  ),
  counted AS (
    SELECT count(*) AS cnt FROM filtered
  )
  SELECT 
    f.id, f.title, f.job_title, f.job_summary, f.job_description,
    f.city, f.state, f.location, f.salary_min, f.salary_max,
    f.salary_type, f.job_type, f.created_at, f.dest_city, f.dest_state,
    f.organization_id, f.client_id, f.status, f.is_hidden,
    f.category_id, f.updated_at, f.user_id,
    f.apply_url, f.url, f.experience_level, f.remote_type,
    c.cnt AS total_count
  FROM filtered f, counted c
  ORDER BY md5(f.id::text || _seed)
  LIMIT _limit OFFSET _offset;
$$;