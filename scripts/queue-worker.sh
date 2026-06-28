#!/bin/bash
# Hinge queue worker — processes ALL _processing tasks and reports to chat
# Runs from cron via no_agent=True (stdout is delivered to the chat)

WORKSPACE="/opt/data/workspace/hinge"
QUEUE_DIR="$WORKSPACE/.hinge"

cd "$WORKSPACE" || exit 1

# Find ALL _processing folders (sorted by name = oldest first)
mapfile -t processing_folders < <(ls -d "$QUEUE_DIR"/*_processing 2>/dev/null | sort)

if [ ${#processing_folders[@]} -eq 0 ]; then
  exit 0  # No tasks — silent exit
fi

processed=0
reports=""

for processing in "${processing_folders[@]}"; do
  folder_name=$(basename "$processing")
  input_file="$processing/input.md"

  if [ ! -f "$input_file" ]; then
    echo "⚠️ Task $folder_name has no input.md, skipping..."
    mv "$processing" "${processing/_processing/_done}" 2>/dev/null
    continue
  fi

  # Read task content
  content=$(cat "$input_file")

  # Run hermes -z with the content
  output=$(timeout 300 hermes -z "$content" 2>&1)
  exit_code=$?

  # Write output.md (must succeed before rename)
  echo "$output" > "$processing/output.md"
  sync

  # Rename to done
  done_path="${processing/_processing/_done}"
  mv "$processing" "$done_path" 2>/dev/null

  # Build report
  reports+="**$(basename "$done_path")** — "
  reports+="$(echo "$content" | head -1 | tr '\n' ' ')\n"
  reports+='```\n'
  reports+="$(echo "$output" | head -10)\n"
  lines=$(echo "$output" | wc -l)
  if [ "$lines" -gt 10 ]; then
    reports+="...\n"
  fi
  reports+='```\n\n'
  
  processed=$((processed + 1))
done

# Single report for all tasks
echo "👋 **Выполнено задач: $processed**"
echo ""
echo -e "$reports"
