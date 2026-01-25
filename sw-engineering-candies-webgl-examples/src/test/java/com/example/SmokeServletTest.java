package com.example;


import javax.servlet.Servlet;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class SmokeServletTest {
    private static Server server;
    private static int port = 8085;

    @BeforeAll
    public static void startServer() throws Exception {
        server = new Server(port);
        ServletContextHandler handler = new ServletContextHandler();
        handler.setContextPath("/");
        handler.addServlet(new ServletHolder(new SmokeServlet()), "/smoke");
        server.setHandler(handler);
        server.start();
    }

    @AfterAll
    public static void stopServer() throws Exception {
        if (server != null) server.stop();
    }

    @Test
    public void smokeReturnsOK() throws Exception {
        URL u = new URL("http://localhost:" + port + "/smoke");
        HttpURLConnection c = (HttpURLConnection) u.openConnection();
        c.setRequestMethod("GET");
        int code = c.getResponseCode();
        InputStream is = c.getInputStream();
        byte[] buf = new byte[2];
        int r = is.read(buf);
        String s = new String(buf, 0, r);
        assertEquals(200, code);
        assertEquals("OK", s);
    }
}
