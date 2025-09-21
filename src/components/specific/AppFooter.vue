<template>
  <footer
    class="app-footer"
    role="contentinfo"
    aria-label="Site footer with author information and links"
  >
    <div class="footer-content">
      <section class="footer-section" aria-labelledby="app-description">
        <h4 id="app-description">Speech Teleprompter</h4>
        <p>
          Free real-time speech recognition teleprompter powered by Web Speech
          API. Perfect for presentations, speeches, and content creation.
        </p>
      </section>

      <section class="footer-section" aria-labelledby="author-links">
        <h4 id="author-links">Author</h4>
        <nav
          class="author-links"
          aria-label="Author social media and blog links"
        >
          <BaseLink
            href="https://www.linkedin.com/in/andrey-roshchupkin"
            target="_blank"
            rel="noopener noreferrer"
            variant="footer"
            icon="💼"
            aria-label="Visit Andrey Roshchupkin's LinkedIn profile"
          >
            LinkedIn
          </BaseLink>
          <BaseLink
            href="https://sdet-andrew.hashnode.dev"
            target="_blank"
            rel="noopener noreferrer"
            variant="footer"
            icon="📝"
            aria-label="Visit Andrey Roshchupkin's technical blog"
          >
            Blog
          </BaseLink>
        </nav>
      </section>

      <section class="footer-section" aria-labelledby="source-code">
        <h4 id="source-code">Source Code</h4>
        <BaseLink
          href="https://github.com/Andrey-Roshchupkin/speech-teleprompter"
          target="_blank"
          rel="noopener noreferrer"
          variant="footer"
          icon="🔗"
          aria-label="View Speech Teleprompter source code on GitHub"
        >
          GitHub Repository
        </BaseLink>
      </section>
    </div>

    <div class="footer-bottom" role="contentinfo">
      <p>
        &copy; 2025 Andrey Roshchupkin. Free Speech Teleprompter with real-time
        speech recognition.
      </p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import BaseLink from '@/components/base/BaseLink.vue';
</script>

<style scoped>
.app-footer {
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
  border-top: 2px solid var(--border-color);
  margin-top: auto;
  padding: 30px 20px 20px;
  color: var(--text-secondary);
}

.footer-content {
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
  margin-bottom: 20px;
}

.footer-section {
  display: flex;
  flex-direction: column;
}

.footer-section h4 {
  color: var(--text-primary);
  margin-bottom: 15px;
  font-size: 1.1em;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-color);
  padding-bottom: 5px;
  display: inline-block;
}

.footer-section p {
  line-height: 1.6;
  margin: 0;
  font-size: 14px;
}

.author-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.footer-bottom p {
  margin: 0;
  font-size: 13px;
  color: var(--text-color-secondary);
  line-height: 1.5;
}
</style>
