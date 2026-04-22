# Portfolio Content Guide

Most portfolio content is stored in `data/portfolio.json`.

You can update the site without editing layout code:

- Add a project by copying one project block inside `"projects"` and changing the text, image, and links.
- Set a project's broad left-menu group with `"category"`. Recommended categories are `"Games"`, `"Interactive Web"`, `"Art & 3D"`, and `"Tools & Apps"`.
- Put the more specific project type in `"tags"`, like `"Game Systems"`, `"Visual Novel"`, `"AI"`, `"Internal Ops"`, or `"Desktop App"`.
- Use `"thumbnail"` for the bottom project portrait. If it is missing, the site uses `"image"`.
- Use `"characterImage"` to show a character or render on the right side of that project's showcase page.
- Add a skill by adding a `{ "name": "Skill Name", "percent": 50 }` line inside the right category.
- Change your comfort level by editing the number after `"percent"`.
- The visible skill level is automatic from `"percent"`: `0-49` Beginner, `50-69` Intermediate, `70-84` Advanced, `85-100` Expert.
- Add artwork by placing the image in `img/art/` and adding one block inside `"art"`.
- Update contact details in the `"contact"` section.

Rules that matter:

- Keep commas between items.
- Keep image paths relative to the site root, like `img/art/my-art.jpg`.
- Use percentages from `0` to `100`.
- For project media, use either `"image"` or `"embed"`. Use `"embed"` only for playable pages or videos that can be shown in an iframe.
- `"galleryImages"` can contain one image or many images. A single image shows as a `View Image` button; multiple images show as a gallery.
