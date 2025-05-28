---
layout: default # Or a specific 'page' layout
title: Blog
permalink: /blog/
---

<div class="page-content">
  <h1>Latest Posts</h1>
  <p>Welcome to my collection of thoughts and writings. Use `cd ..` or a navigation command in the terminal (if available) or your browser's back button to return to the terminal.</p>

  <ul>
    {% for post in site.posts limit:10 %}
      <li>
        <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
        <p><small>Published on: {{ post.date | date: "%B %d, %Y" }}</small></p>
        {{ post.excerpt }}
        <p><a href="{{ post.url | relative_url }}">Read more...</a></p>
      </li>
    {% endfor %}
  </ul>

  {% if paginator.total_pages > 1 %}
  <div class="pagination">
    {% if paginator.previous_page %}
      <a href="{{ paginator.previous_page_path | relative_url }}" class="previous">Previous</a>
    {% else %}
      <span class="previous">Previous</span>
    {% endif %}
    <span class="page_number ">Page: {{ paginator.page }} of {{ paginator.total_pages }}</span>
    {% if paginator.next_page %}
      <a href="{{ paginator.next_page_path | relative_url }}" class="next">Next</a>
    {% else %}
      <span class="next ">Next</span>
    {% endif %}
  </div>
  {% endif %}
</div>